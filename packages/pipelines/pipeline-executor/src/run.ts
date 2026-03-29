import type { Span } from "@opentelemetry/api";
import type {
  AnyPipelineDefinition,
  AnyPipelineRouteDefinition,
  FileContext,
  NormalizedRouteOutputDefinition,
  PipelineLogger,
} from "@ucdjs/pipelines-core";
import type { PipelineError, PipelineOutputManifestEntry } from "@ucdjs/pipelines-core/tracing";
import type { CacheStore } from "./cache";
import type { SourceAdapter } from "./run/source-files";
import type { PipelineExecutionRuntime } from "./runtime";
import type {
  ExecutionStatus,
  PipelineExecutionResult,
  PipelineExecutorRunOptions,
  PipelineSummary,
} from "./types";
import { SpanStatusCode } from "@opentelemetry/api";
import { createPipelineLogger } from "./internal/logger";
import { buildCacheKey, storeCacheEntry, tryLoadCachedResult } from "./run/cache-helpers";
import { DEFAULT_FALLBACK_OUTPUTS, materializeOutputs } from "./run/outputs";
import { createProcessingQueue } from "./run/processing-queue";
import { processFallback, processRoute } from "./run/route-runtime";
import { buildRouteOutputs, buildRoutesByLayer, createSummary, resolveVersions } from "./run/setup";
import { createSourceAdapter, isSourceFileContext } from "./run/source-files";

type RouteDef = AnyPipelineRouteDefinition;

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
  versions: string[];
  routesByLayer: RouteDef[][];
  routeOutputs: Map<string, readonly NormalizedRouteOutputDefinition[]>;
  cacheStore?: CacheStore;
  useCache: boolean;
  outputs: unknown[];
  outputManifest: PipelineOutputManifestEntry[];
  errors: PipelineError[];
  summary: PipelineSummary;
}

interface VersionContext {
  version: string;
  routeDataMap: Record<string, unknown[]>;
  listFiles: () => Promise<FileContext[]>;
}

export async function run(options: RunPipelineOptions): Promise<PipelineExecutionResult> {
  const ctx = createRunCtx(options);

  return ctx.runtime.startSpan("pipeline", async (pipelineSpan) => {
    const startPerf = performance.now();
    pipelineSpan.setAttributes({
      "pipeline.id": ctx.pipeline.id,
      "pipeline.versions": ctx.versions,
    });

    for (const version of ctx.versions) {
      await runVersion(ctx, version);
    }

    const durationMs = performance.now() - startPerf;
    ctx.summary.totalOutputs = ctx.outputs.length;
    ctx.summary.durationMs = durationMs;

    const status: ExecutionStatus = ctx.errors.length === 0 ? "completed" : "failed";
    pipelineSpan.setAttributes({
      "summary.total.files": ctx.summary.totalFiles,
      "summary.matched.files": ctx.summary.matchedFiles,
      "summary.total.outputs": ctx.summary.totalOutputs,
      "summary.duration.ms": durationMs,
      "execution.status": status,
    });

    return {
      id: ctx.pipeline.id,
      data: ctx.outputs,
      outputManifest: ctx.outputManifest,
      errors: ctx.errors,
      summary: ctx.summary,
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
    versions,
    routesByLayer: buildRoutesByLayer(pipeline),
    routeOutputs: buildRouteOutputs(pipeline),
    cacheStore,
    useCache: (runOptions.cache ?? true) && cacheStore != null,
    outputs: [],
    outputManifest: [],
    errors: [],
    summary: createSummary(versions),
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

async function runVersion(ctx: RunCtx, version: string): Promise<void> {
  await ctx.runtime.startSpan("version", async (versionSpan) => {
    const startPerf = performance.now();
    versionSpan.setAttributes({
      "pipeline.id": ctx.pipeline.id,
      "pipeline.version": version,
    });

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
    ctx.summary.totalFiles += files.length;

    for (const routes of ctx.routesByLayer) {
      const queue = createProcessingQueue(ctx.pipeline.concurrency);

      for (const route of routes) {
        for (const file of selectMatchingFiles(ctx, route, includedFiles)) {
          processedFiles.add(file.path);
          ctx.summary.totalRoutes++;
          const queuedAt = performance.now();
          versionSpan.addEvent("file.queued", {
            "pipeline.id": ctx.pipeline.id,
            "pipeline.version": version,
            "route.id": route.id,
            ...fileAttrs(file),
          });

          await queue.add(async () => {
            versionSpan.addEvent("file.dequeued", {
              "pipeline.id": ctx.pipeline.id,
              "pipeline.version": version,
              "route.id": route.id,
              ...fileAttrs(file),
              "wait.ms": performance.now() - queuedAt,
            });
            await executeMatchedFile(ctx, versionContext, version, route, file);
          });
        }
      }

      await queue.drain();
    }

    for (const file of includedFiles) {
      if (!processedFiles.has(file.path)) {
        await executeUnmatchedFile(ctx, versionContext, version, file, versionSpan);
      }
    }

    versionSpan.setAttribute("duration.ms", performance.now() - startPerf);
  });
}

function selectMatchingFiles(
  ctx: RunCtx,
  route: RouteDef,
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
  route: RouteDef,
  file: FileContext,
): Promise<void> {
  await ctx.runtime.startSpan("file.route", async (routeSpan) => {
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

    ctx.summary.matchedFiles++;

    try {
      const result = await loadRouteResult(ctx, version, route, file, versionContext.routeDataMap, routeSpan);

      versionContext.routeDataMap[route.id] ??= [];
      versionContext.routeDataMap[route.id]!.push(...result.outputs);

      const { entries, writeErrors } = await materializeOutputs({
        outputs: ctx.outputs,
        version,
        routeId: route.id,
        file,
        values: result.outputs,
        definitions: ctx.routeOutputs.get(route.id) ?? DEFAULT_FALLBACK_OUTPUTS,
        runtime: ctx.runtime,
        pipelineId: ctx.pipeline.id,
      });
      ctx.outputManifest.push(...entries);
      for (const { error } of writeErrors) {
        ctx.errors.push({
          scope: "route",
          message: error instanceof Error ? error.message : String(error),
          error,
          file,
          routeId: route.id,
          version,
        });
      }
    } catch (error) {
      ctx.errors.push({
        scope: "route",
        message: error instanceof Error ? error.message : String(error),
        error,
        file,
        routeId: route.id,
        version,
      });
      routeSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      routeSpan.recordException(error instanceof Error ? error : new Error(String(error)));
    }

    routeSpan.setAttribute("duration.ms", performance.now() - startPerf);
  });
}

async function executeUnmatchedFile(
  ctx: RunCtx,
  versionContext: VersionContext,
  version: string,
  file: FileContext,
  versionSpan: Span,
): Promise<void> {
  const { pipeline, logger } = ctx;

  if (!pipeline.fallback) {
    ctx.summary.skippedFiles++;
    if (pipeline.strict) {
      ctx.errors.push({
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
    ctx.summary.skippedFiles++;
    versionSpan.addEvent("file.skipped", {
      "pipeline.id": ctx.pipeline.id,
      "pipeline.version": version,
      ...fileAttrs(file),
      "skipped.reason": "filtered",
    });
    return;
  }

  ctx.summary.fallbackFiles++;
  await executeFallbackFile(ctx, versionContext, version, file);
}

async function executeFallbackFile(
  ctx: RunCtx,
  versionContext: VersionContext,
  version: string,
  file: FileContext,
): Promise<void> {
  await ctx.runtime.startSpan("file.route", async (routeSpan) => {
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
      const outputs = await processFallback({
        file,
        fallback: ctx.pipeline.fallback!,
        routeDataMap: versionContext.routeDataMap,
        runtime: ctx.runtime,
        source: ctx.source,
        version,
        pipelineId: ctx.pipeline.id,
      });

      const { entries, writeErrors } = await materializeOutputs({
        outputs: ctx.outputs,
        version,
        routeId: "__fallback__",
        file,
        values: outputs,
        definitions: DEFAULT_FALLBACK_OUTPUTS,
        runtime: ctx.runtime,
        pipelineId: ctx.pipeline.id,
      });
      ctx.outputManifest.push(...entries);
      for (const { error } of writeErrors) {
        ctx.errors.push({
          scope: "file",
          message: error instanceof Error ? error.message : String(error),
          error,
          file,
          version,
        });
      }
    } catch (error) {
      ctx.errors.push({
        scope: "file",
        message: error instanceof Error ? error.message : String(error),
        error,
        file,
        version,
      });
      routeSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      routeSpan.recordException(error instanceof Error ? error : new Error(String(error)));
    }

    routeSpan.setAttribute("duration.ms", performance.now() - startPerf);
  });
}

async function loadRouteResult(
  ctx: RunCtx,
  version: string,
  route: RouteDef,
  file: FileContext,
  routeDataMap: Record<string, unknown[]>,
  routeSpan: Span,
): Promise<{ outputs: unknown[] }> {
  const { cacheStore, runtime, source, useCache } = ctx;
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
      ctx.summary.cached++;
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
      return cached.result;
    }
  }

  const result = await processRoute({
    file,
    route,
    routeDataMap,
    runtime,
    source,
    version,
    pipelineId: ctx.pipeline.id,
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

    await storeCacheEntry({ cacheStore, cacheKey, outputs: result.outputs });
    routeSpan.addEvent("cache.store", {
      "pipeline.id": ctx.pipeline.id,
      "pipeline.version": version,
      "route.id": route.id,
      ...fileAttrs(file),
    });
  }

  return result;
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
