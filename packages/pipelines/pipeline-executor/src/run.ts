import type { Span, SpanContext } from "@opentelemetry/api";
import type {
  AnyPipelineDefinition,
  AnyPipelineRouteDefinition,
  FileContext,
  NormalizedRouteOutputDefinition,
  PipelineLogger,
} from "@ucdjs/pipeline-core";
import type { PipelineError, PipelineOutputManifestEntry } from "@ucdjs/pipeline-core/tracing";
import type { CacheStore } from "./cache";
import type { ExecutionContext } from "./run/context";
import type { SourceAdapter } from "./run/source";
import type { PipelineExecutionRuntime } from "./runtime";
import type {
  ExecutionStatus,
  PipelineExecutionResult,
  PipelineExecutorRunOptions,
  PipelineSummary,
} from "./types";
import { SpanStatusCode } from "@opentelemetry/api";
import { buildCacheKey, storeCacheEntry, tryLoadCachedResult } from "./cache";
import { runPipelineHook } from "./run/hooks";
import { DEFAULT_FALLBACK_OUTPUTS, materializeOutputs } from "./run/outputs";
import { createProcessingQueue } from "./run/queue";
import { executeParseResolve } from "./run/route";
import { buildRouteOutputs, buildRoutesByLayer, createSummary, resolveVersions } from "./run/setup";
import { createSourceAdapter, isSourceFileContext } from "./run/source";
import { createPipelineLogger } from "./runtime";

export interface RunPipelineOptions {
  pipeline: AnyPipelineDefinition;
  runOptions?: PipelineExecutorRunOptions;
  cacheStore?: CacheStore;
  runtime: PipelineExecutionRuntime;
  priorResults?: PipelineExecutionResult[];
}

interface RunCtx {
  pipeline: AnyPipelineDefinition;
  runtime: PipelineExecutionRuntime;
  source: SourceAdapter;
  logger: PipelineLogger;
  hooks: AnyPipelineDefinition["hooks"];
  versions: string[];
  routesByLayer: AnyPipelineRouteDefinition[][];
  routeOutputs: Map<string, readonly NormalizedRouteOutputDefinition[]>;
  cacheStore?: CacheStore;
  useCache: boolean;
}

interface VersionContext {
  version: string;
  routeDataMap: Record<string, unknown[]>;
  listFiles: () => Promise<FileContext[]>;
}

interface VersionExecutionSummary {
  totalRoutes: number;
  cached: number;
  totalFiles: number;
  matchedFiles: number;
  skippedFiles: number;
  fallbackFiles: number;
}

interface BufferedOutputBatch {
  scope: "route" | "file";
  version: string;
  routeId: string;
  file: FileContext;
  values: readonly unknown[];
  definitions: readonly NormalizedRouteOutputDefinition[];
  parentSpanContext: SpanContext;
}

interface VersionExecutionResult {
  summary: VersionExecutionSummary;
  errors: PipelineError[];
  bufferedOutputs: BufferedOutputBatch[];
}

interface RouteExecutionResult {
  success: boolean;
  routeId: string;
  file: FileContext;
  outputs: unknown[];
  cached: number;
  errors: PipelineError[];
  parentSpanContext: SpanContext;
}

export async function run(options: RunPipelineOptions): Promise<PipelineExecutionResult> {
  const ctx = createRunCtx(options);

  return ctx.runtime.startSpan("pipeline", async (pipelineSpan) => {
    const startPerf = performance.now();
    const outputs: unknown[] = [];
    const outputManifest: PipelineOutputManifestEntry[] = [];
    const errors: PipelineError[] = [];
    const summary = createSummary(ctx.versions);
    pipelineSpan.setAttributes({
      "pipeline.id": ctx.pipeline.id,
      "pipeline.versions": ctx.versions,
    });
    await runPipelineHook("pipeline:start", () => ctx.hooks?.pipeline?.({
      phase: "start",
      pipelineId: ctx.pipeline.id,
      logger: ctx.logger,
    }), { logger: ctx.logger });

    const versionResults = await Promise.all(
      ctx.versions.map((version) => runVersion(ctx, version)),
    );

    for (const versionResult of versionResults) {
      mergeSummary(summary, versionResult.summary);
      errors.push(...versionResult.errors);
    }

    const locatorRegistry = new Map<string, { version: string; routeId: string; outputId: string }>();
    for (const versionResult of versionResults) {
      for (const batch of versionResult.bufferedOutputs) {
        const { entries, writeErrors } = await materializeOutputs({
          outputs,
          version: batch.version,
          routeId: batch.routeId,
          file: batch.file,
          values: batch.values,
          definitions: batch.definitions,
          runtime: ctx.runtime,
          pipelineId: ctx.pipeline.id,
          hooks: ctx.hooks,
          logger: ctx.logger,
          locatorRegistry,
          parentSpanContext: batch.parentSpanContext,
        });
        outputManifest.push(...entries);
        pushWriteErrors(
          errors,
          writeErrors,
          batch.scope,
          batch.file,
          batch.version,
          batch.scope === "route" ? batch.routeId : undefined,
        );
      }
    }

    const durationMs = performance.now() - startPerf;
    summary.totalOutputs = outputs.length;
    summary.durationMs = durationMs;

    const status: ExecutionStatus = errors.length === 0 ? "completed" : "failed";
    pipelineSpan.setAttributes({
      "summary.total.files": summary.totalFiles,
      "summary.matched.files": summary.matchedFiles,
      "summary.total.outputs": summary.totalOutputs,
      "summary.duration.ms": durationMs,
      "execution.status": status,
    });
    await runPipelineHook("pipeline:end", () => ctx.hooks?.pipeline?.({
      phase: "end",
      pipelineId: ctx.pipeline.id,
      logger: ctx.logger,
      error: errors.length > 0 ? errors : undefined,
    }), { logger: ctx.logger });

    return {
      id: ctx.pipeline.id,
      data: outputs,
      outputManifest,
      errors,
      summary,
      status,
    };
  }) as Promise<PipelineExecutionResult>;
}

function createRunCtx(options: RunPipelineOptions): RunCtx {
  const { pipeline, runOptions = {}, cacheStore, runtime, priorResults = [] } = options;
  const versions = resolveVersions(pipeline, runOptions);
  const logger = createPipelineLogger(runtime);

  return {
    pipeline,
    runtime,
    source: createSourceAdapter(pipeline, logger, { priorResults }),
    logger,
    hooks: pipeline.hooks,
    versions,
    routesByLayer: buildRoutesByLayer(pipeline),
    routeOutputs: buildRouteOutputs(pipeline),
    cacheStore,
    useCache: (runOptions.cache ?? true) && cacheStore != null,
  };
}

function createVersionContext(ctx: RunCtx, version: string): VersionContext {
  let files: FileContext[] | null = null;

  return {
    version,
    routeDataMap: {},
    listFiles: async () => {
      if (files !== null) {
        return files;
      }

      files = await ctx.runtime.startSpan("source.listing", async (span) => {
        span.setAttributes({
          "pipeline.id": ctx.pipeline.id,
          "pipeline.version": version,
        });
        const result = await ctx.source.listFiles(version);
        span.setAttribute("file.count", result.length);
        return result;
      }) as FileContext[];

      return files;
    },
  };
}

async function runVersion(ctx: RunCtx, version: string): Promise<VersionExecutionResult> {
  const result = createVersionExecutionResult();

  await ctx.runtime.startSpan("version", async (versionSpan) => {
    const startPerf = performance.now();
    versionSpan.setAttributes({
      "pipeline.id": ctx.pipeline.id,
      "pipeline.version": version,
    });
    await runPipelineHook("version:start", () => ctx.hooks?.version?.({
      phase: "start",
      pipelineId: ctx.pipeline.id,
      version,
      logger: ctx.logger,
    }), { logger: ctx.logger });

    const versionContext = createVersionContext(ctx, version);
    const files = await versionContext.listFiles();
    const includedFiles = ctx.pipeline.include
      ? files.filter((file) => ctx.pipeline.include!({
          file,
          logger: ctx.logger,
          source: isSourceFileContext(file) ? file.source : undefined,
        }))
      : files;

    const processedFiles = new Set<string>();
    result.summary.totalFiles += files.length;

    for (const routes of ctx.routesByLayer) {
      const queue = createProcessingQueue(ctx.pipeline.concurrency);
      const layerRuns: Promise<RouteExecutionResult>[] = [];

      for (const route of routes) {
        for (const file of selectMatchingFiles(ctx, route, includedFiles)) {
          processedFiles.add(file.path);
          result.summary.totalRoutes++;
          result.summary.matchedFiles++;
          const queuedAt = performance.now();
          versionSpan.addEvent("file.queued", {
            "pipeline.id": ctx.pipeline.id,
            "pipeline.version": version,
            "route.id": route.id,
            ...fileAttrs(file),
          });

          layerRuns.push(queue.add(async () => {
            versionSpan.addEvent("file.dequeued", {
              "pipeline.id": ctx.pipeline.id,
              "pipeline.version": version,
              "route.id": route.id,
              ...fileAttrs(file),
              "wait.ms": performance.now() - queuedAt,
            });
            return executeMatchedFile(ctx, versionContext, version, route, file);
          }));
        }
      }

      const layerResults = await Promise.all(layerRuns);
      await queue.drain();

      for (const layerResult of layerResults) {
        result.summary.cached += layerResult.cached;
        result.errors.push(...layerResult.errors);

        if (!layerResult.success) {
          continue;
        }

        versionContext.routeDataMap[layerResult.routeId] ??= [];
        versionContext.routeDataMap[layerResult.routeId]!.push(...layerResult.outputs);
        result.bufferedOutputs.push({
          scope: "route",
          version,
          routeId: layerResult.routeId,
          file: layerResult.file,
          values: layerResult.outputs,
          definitions: ctx.routeOutputs.get(layerResult.routeId) ?? DEFAULT_FALLBACK_OUTPUTS,
          parentSpanContext: layerResult.parentSpanContext,
        });
      }
    }

    for (const file of includedFiles) {
      if (!processedFiles.has(file.path)) {
        await executeUnmatchedFile(ctx, versionContext, version, file, versionSpan, result);
      }
    }

    versionSpan.setAttribute("duration.ms", performance.now() - startPerf);
    await runPipelineHook("version:end", () => ctx.hooks?.version?.({
      phase: "end",
      pipelineId: ctx.pipeline.id,
      version,
      logger: ctx.logger,
      error: result.errors.length > 0 ? result.errors : undefined,
    }), { logger: ctx.logger });
  });

  return result;
}

function selectMatchingFiles(
  ctx: RunCtx,
  route: AnyPipelineRouteDefinition,
  files: readonly FileContext[],
): FileContext[] {
  return files.filter((file) => route.filter({
    file,
    logger: ctx.logger,
    source: isSourceFileContext(file) ? file.source : undefined,
  }));
}

async function executeMatchedFile(
  ctx: RunCtx,
  versionContext: VersionContext,
  version: string,
  route: AnyPipelineRouteDefinition,
  file: FileContext,
): Promise<RouteExecutionResult> {
  return ctx.runtime.startSpan("file.route", async (routeSpan) => {
    const startPerf = performance.now();
    routeSpan.setAttributes({
      "pipeline.id": ctx.pipeline.id,
      "pipeline.version": version,
      "route.id": route.id,
      ...fileAttrs(file),
    });

    routeSpan.addEvent("source.provided", {
      "pipeline.id": ctx.pipeline.id,
      "pipeline.version": version,
      ...fileAttrs(file),
    });
    routeSpan.addEvent("file.matched", {
      "pipeline.id": ctx.pipeline.id,
      "pipeline.version": version,
      "route.id": route.id,
      ...fileAttrs(file),
    });

    try {
      const routeCtx: ExecutionContext = {
        pipelineId: ctx.pipeline.id,
        version,
        file,
        logger: ctx.logger,
        hooks: ctx.hooks,
        source: ctx.source,
        runtime: ctx.runtime,
        routeDataMap: versionContext.routeDataMap,
      };
      await runPipelineHook("route:start", () => ctx.hooks?.route?.({
        phase: "start",
        pipelineId: ctx.pipeline.id,
        version,
        file,
        routeId: route.id,
        logger: ctx.logger,
      }), { logger: ctx.logger });
      const result = await loadRouteResult(ctx, route, routeSpan, routeCtx);
      await runPipelineHook("route:end", () => ctx.hooks?.route?.({
        phase: "end",
        pipelineId: ctx.pipeline.id,
        version,
        file,
        routeId: route.id,
        logger: ctx.logger,
        outputs: result.outputs,
      }), { logger: ctx.logger });

      routeSpan.setAttribute("duration.ms", performance.now() - startPerf);
      return {
        success: true,
        routeId: route.id,
        file,
        outputs: result.outputs,
        cached: result.cached ? 1 : 0,
        errors: [],
        parentSpanContext: routeSpan.spanContext(),
      };
    } catch (error) {
      const routeError = recordSpanError(routeSpan, error, "route", file, version, route.id);
      await runPipelineHook("route:end", () => ctx.hooks?.route?.({
        phase: "end",
        pipelineId: ctx.pipeline.id,
        version,
        file,
        routeId: route.id,
        logger: ctx.logger,
        error,
      }), { logger: ctx.logger });
      routeSpan.setAttribute("duration.ms", performance.now() - startPerf);
      return {
        success: false,
        routeId: route.id,
        file,
        outputs: [],
        cached: 0,
        errors: [routeError],
        parentSpanContext: routeSpan.spanContext(),
      };
    }
  }) as Promise<RouteExecutionResult>;
}

async function executeUnmatchedFile(
  ctx: RunCtx,
  versionContext: VersionContext,
  version: string,
  file: FileContext,
  versionSpan: Span,
  result: VersionExecutionResult,
): Promise<void> {
  const { pipeline, logger } = ctx;

  if (!pipeline.fallback) {
    result.summary.skippedFiles++;
    if (pipeline.strict) {
      result.errors.push({
        scope: "file",
        message: `No matching route for file: ${file.path}`,
        file,
        version,
      });
      return;
    }

    versionSpan.addEvent("file.skipped", {
      "pipeline.id": ctx.pipeline.id,
      "pipeline.version": version,
      ...fileAttrs(file),
      "skipped.reason": "no-match",
    });
    return;
  }

  if (pipeline.fallback.filter && !pipeline.fallback.filter({
    file,
    logger,
    source: isSourceFileContext(file) ? file.source : undefined,
  })) {
    result.summary.skippedFiles++;
    versionSpan.addEvent("file.skipped", {
      "pipeline.id": ctx.pipeline.id,
      "pipeline.version": version,
      ...fileAttrs(file),
      "skipped.reason": "filtered",
    });
    return;
  }

  result.summary.fallbackFiles++;
  const fallbackResult = await executeFallbackFile(ctx, versionContext, version, file);
  result.errors.push(...fallbackResult.errors);
  if (!fallbackResult.success) {
    return;
  }

  result.bufferedOutputs.push({
    scope: "file",
    version,
    routeId: "__fallback__",
    file,
    values: fallbackResult.outputs,
    definitions: DEFAULT_FALLBACK_OUTPUTS,
    parentSpanContext: fallbackResult.parentSpanContext,
  });
}

async function executeFallbackFile(
  ctx: RunCtx,
  versionContext: VersionContext,
  version: string,
  file: FileContext,
): Promise<RouteExecutionResult> {
  return ctx.runtime.startSpan("file.route", async (routeSpan) => {
    const startPerf = performance.now();
    routeSpan.setAttributes({
      "pipeline.id": ctx.pipeline.id,
      "pipeline.version": version,
      "route.id": "__fallback__",
      ...fileAttrs(file),
    });

    routeSpan.addEvent("source.provided", {
      "pipeline.id": ctx.pipeline.id,
      "pipeline.version": version,
      ...fileAttrs(file),
    });
    routeSpan.addEvent("file.fallback", {
      "pipeline.id": ctx.pipeline.id,
      "pipeline.version": version,
      ...fileAttrs(file),
    });

    try {
      const routeCtx: ExecutionContext = {
        pipelineId: ctx.pipeline.id,
        version,
        file,
        logger: ctx.logger,
        hooks: ctx.hooks,
        source: ctx.source,
        runtime: ctx.runtime,
        routeDataMap: versionContext.routeDataMap,
      };
      const fallback = ctx.pipeline.fallback!;
      await runPipelineHook("route:start", () => ctx.hooks?.route?.({
        phase: "start",
        pipelineId: ctx.pipeline.id,
        version,
        file,
        routeId: "__fallback__",
        logger: ctx.logger,
      }), { logger: ctx.logger });
      const outputs = await executeParseResolve({
        ctx: routeCtx,
        routeId: "__fallback__",
        parser: fallback.parser,
        filter: fallback.filter,
        resolver: fallback.resolver,
      });
      await runPipelineHook("route:end", () => ctx.hooks?.route?.({
        phase: "end",
        pipelineId: ctx.pipeline.id,
        version,
        file,
        routeId: "__fallback__",
        logger: ctx.logger,
        outputs,
      }), { logger: ctx.logger });
      routeSpan.setAttribute("duration.ms", performance.now() - startPerf);
      return {
        success: true,
        routeId: "__fallback__",
        file,
        outputs,
        cached: 0,
        errors: [],
        parentSpanContext: routeSpan.spanContext(),
      };
    } catch (error) {
      const routeError = recordSpanError(routeSpan, error, "file", file, version);
      await runPipelineHook("route:end", () => ctx.hooks?.route?.({
        phase: "end",
        pipelineId: ctx.pipeline.id,
        version,
        file,
        routeId: "__fallback__",
        logger: ctx.logger,
        error,
      }), { logger: ctx.logger });
      routeSpan.setAttribute("duration.ms", performance.now() - startPerf);
      return {
        success: false,
        routeId: "__fallback__",
        file,
        outputs: [],
        cached: 0,
        errors: [routeError],
        parentSpanContext: routeSpan.spanContext(),
      };
    }
  }) as Promise<RouteExecutionResult>;
}

async function loadRouteResult(
  ctx: RunCtx,
  route: AnyPipelineRouteDefinition,
  routeSpan: Span,
  routeCtx: ExecutionContext,
): Promise<{ outputs: unknown[]; cached: boolean }> {
  const { cacheStore, source, useCache } = ctx;
  const { version, file, routeDataMap } = routeCtx;
  const routeCacheEnabled = useCache && route.cache !== false;
  let fileContent: string | undefined;

  if (routeCacheEnabled && cacheStore) {
    fileContent = await source.readFile(file);
    const cached = await tryLoadCachedResult({
      cacheStore,
      routeId: route.id,
      version,
      fileContent,
      routeDataMap,
      depends: route.depends ?? [],
    });

    if (cached.hit) {
      routeSpan.addEvent("cache.hit", {
        "pipeline.id": ctx.pipeline.id,
        "pipeline.version": version,
        "route.id": route.id,
        ...fileAttrs(file),
      });
    } else {
      routeSpan.addEvent("cache.miss", {
        "pipeline.id": ctx.pipeline.id,
        "pipeline.version": version,
        "route.id": route.id,
        ...fileAttrs(file),
      });
    }

    if (cached.hit && cached.result) {
      return {
        outputs: cached.result.outputs,
        cached: true,
      };
    }
  }

  const outputs = await executeParseResolve({
    ctx: routeCtx,
    routeId: route.id,
    parser: route.parser,
    filter: route.filter,
    transforms: route.transforms,
    resolver: route.resolver,
  });

  if (routeCacheEnabled && cacheStore) {
    fileContent ??= await source.readFile(file);
    const cacheKey = buildCacheKey(
      route.id,
      version,
      fileContent,
      routeDataMap,
      route.depends ?? [],
    );

    await storeCacheEntry({ cacheStore, cacheKey, outputs });
    routeSpan.addEvent("cache.store", {
      "pipeline.id": ctx.pipeline.id,
      "pipeline.version": version,
      "route.id": route.id,
      ...fileAttrs(file),
    });
  }

  return { outputs, cached: false };
}

function pushWriteErrors(
  errors: PipelineError[],
  writeErrors: { error: unknown }[],
  scope: "route" | "file",
  file: FileContext,
  version: string,
  routeId?: string,
): void {
  for (const { error } of writeErrors) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push({
      scope,
      message,
      error,
      file,
      ...(routeId != null && { routeId }),
      version,
    });
  }
}

function recordSpanError(
  span: Span,
  error: unknown,
  scope: "route" | "file",
  file: FileContext,
  version: string,
  routeId?: string,
): PipelineError {
  const message = error instanceof Error ? error.message : String(error);
  const pipelineError: PipelineError = {
    scope,
    message,
    error,
    file,
    ...(routeId != null && { routeId }),
    version,
  };
  span.setStatus({ code: SpanStatusCode.ERROR, message });
  span.recordException(error instanceof Error ? error : new Error(message));
  return pipelineError;
}

function createVersionExecutionResult(): VersionExecutionResult {
  return {
    summary: {
      totalRoutes: 0,
      cached: 0,
      totalFiles: 0,
      matchedFiles: 0,
      skippedFiles: 0,
      fallbackFiles: 0,
    },
    errors: [],
    bufferedOutputs: [],
  };
}

function mergeSummary(summary: PipelineSummary, versionSummary: VersionExecutionSummary): void {
  summary.totalRoutes += versionSummary.totalRoutes;
  summary.cached += versionSummary.cached;
  summary.totalFiles += versionSummary.totalFiles;
  summary.matchedFiles += versionSummary.matchedFiles;
  summary.skippedFiles += versionSummary.skippedFiles;
  summary.fallbackFiles += versionSummary.fallbackFiles;
}

function fileAttrs(file: FileContext): Record<string, string> {
  return {
    "file.path": file.path,
    "file.name": file.name,
    "file.dir": file.dir,
    "file.ext": file.ext,
    "file.version": file.version,
  };
}
