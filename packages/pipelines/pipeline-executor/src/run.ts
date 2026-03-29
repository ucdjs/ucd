import type {
  AnyPipelineDefinition,
  AnyPipelineRouteDefinition,
  FileContext,
  NormalizedRouteOutputDefinition,
  PipelineLogger,
} from "@ucdjs/pipelines-core";
import type {
  PipelineError,
  PipelineOutputManifestEntry,
  PipelineTraceEmitInput,
  PipelineTraceRecord,
} from "@ucdjs/pipelines-core/tracing";
import type { CacheStore } from "./cache";
import type { TraceEmitter } from "./internal/trace-emitter";

import type { SourceAdapter } from "./run/source-files";
import type { PipelineExecutionRuntime } from "./runtime";
import type {
  ExecutionStatus,
  PipelineExecutionResult,
  PipelineExecutorRunOptions,
  PipelineSummary,
} from "./types";
import { buildOutputManifestFromTraces } from "@ucdjs/pipelines-core/tracing";
import { createPipelineLogger } from "./internal/logger";
import { buildCacheKey, storeCacheEntry, tryLoadCachedResult } from "./run/cache-helpers";
import { buildExecutionGraphFromTraces } from "./run/graph";
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
  traces: TraceEmitter;
  priorResults?: PipelineExecutionResult[];
  runtime: PipelineExecutionRuntime;
}

export interface RunConfig {
  pipeline: AnyPipelineDefinition;
  cacheStore?: CacheStore;
  traces: TraceEmitter;
  runtime: PipelineExecutionRuntime;
  source: SourceAdapter;
  logger: PipelineLogger;
  useCache: boolean;
  versions: string[];
  routesByLayer: RouteDef[][];
  routeOutputs: Map<string, readonly NormalizedRouteOutputDefinition[]>;
}

export interface RunData {
  outputs: unknown[];
  traceRecords: PipelineTraceRecord[];
  errors: PipelineError[];
  summary: PipelineSummary;
}

export interface RunContext {
  config: RunConfig;
  data: RunData;
  emitTrace: (trace: PipelineTraceEmitInput) => Promise<PipelineTraceRecord>;
}

interface VersionContext {
  version: string;
  routeDataMap: Record<string, unknown[]>;
  listFiles: () => Promise<FileContext[]>;
}

export async function run(options: RunPipelineOptions): Promise<PipelineExecutionResult> {
  const startTime = performance.now();
  const context = createRunContext(options);
  const spanId = context.config.traces.nextSpanId();

  await emitTraceInSpan(context, spanId, {
    kind: "pipeline.start",
    versions: context.config.versions,
  });

  for (const version of context.config.versions) {
    await runVersion(context, version);
  }

  await emitTraceInSpan(context, spanId, {
    kind: "pipeline.end",
    durationMs: performance.now() - startTime,
  });

  return finalizeResult(context, startTime);
}

function createRunContext(options: RunPipelineOptions): RunContext {
  const { pipeline, runOptions = {}, cacheStore, traces, priorResults = [], runtime } = options;
  const versions = resolveVersions(pipeline, runOptions);
  const logger = createPipelineLogger(runtime);

  const config: RunConfig = {
    pipeline,
    cacheStore,
    traces,
    runtime,
    source: createSourceAdapter(pipeline, logger, { priorResults }),
    logger,
    useCache: (runOptions.cache ?? true) && cacheStore != null,
    versions,
    routesByLayer: buildRoutesByLayer(pipeline),
    routeOutputs: buildRouteOutputs(pipeline),
  };

  const data: RunData = {
    outputs: [],
    traceRecords: [],
    errors: [],
    summary: createSummary(versions),
  };

  const emitTrace = async (trace: PipelineTraceEmitInput): Promise<PipelineTraceRecord> => {
    const record = await config.traces.emit({ ...trace, pipelineId: config.pipeline.id });
    data.traceRecords.push(record);
    return record;
  };

  return { config, data, emitTrace };
}

function createVersionContext(
  _context: RunContext,
  version: string,
): VersionContext {
  let files: FileContext[] | null = null;

  return {
    version,
    routeDataMap: {},
    listFiles: async () => {
      files ??= await _context.config.source.listFiles(version);
      return files;
    },
  };
}

async function runVersion(context: RunContext, version: string): Promise<void> {
  const startTime = performance.now();
  const spanId = context.config.traces.nextSpanId();
  const versionContext = createVersionContext(context, version);

  await emitTraceInSpan(context, spanId, {
    kind: "version.start",
    version,
  });

  const files = await versionContext.listFiles();
  const includedFiles = context.config.pipeline.include
    ? files.filter((file) => context.config.pipeline.include!({
        file,
        logger: context.config.logger,
        source: isSourceFileContext(file) ? file.source : undefined,
      }))
    : files;

  const processedFiles = new Set<string>();
  context.data.summary.totalFiles += files.length;

  for (const routes of context.config.routesByLayer) {
    const queue = createProcessingQueue(context.config.pipeline.concurrency);

    for (const route of routes) {
      for (const file of selectMatchingFiles(context, route, includedFiles)) {
        processedFiles.add(file.path);
        context.data.summary.totalRoutes++;
        await queue.add(() => executeMatchedFile(context, versionContext, version, route, file));
      }
    }

    await queue.drain();
  }

  for (const file of includedFiles) {
    if (!processedFiles.has(file.path)) {
      await executeUnmatchedFile(context, versionContext, version, spanId, file);
    }
  }

  await emitTraceInSpan(context, spanId, {
    kind: "version.end",
    version,
    durationMs: performance.now() - startTime,
  });
}

function selectMatchingFiles(
  context: RunContext,
  route: RouteDef,
  files: readonly FileContext[],
): FileContext[] {
  return files.filter((file) => {
    return route.filter({
      file,
      logger: context.config.logger,
      source: isSourceFileContext(file) ? file.source : undefined,
    });
  });
}

async function executeMatchedFile(
  context: RunContext,
  versionContext: VersionContext,
  version: string,
  route: RouteDef,
  file: FileContext,
): Promise<void> {
  const spanId = context.config.traces.nextSpanId();
  context.data.summary.matchedFiles++;

  await emitTraceInSpan(context, spanId, { kind: "source.provided", version, file });
  await emitTraceInSpan(context, spanId, { kind: "file.matched", version, file, routeId: route.id });

  await context.config.runtime.withSpan(spanId, async () => {
    try {
      const result = await loadRouteResult(
        context,
        version,
        route,
        file,
        spanId,
        versionContext.routeDataMap,
      );

      versionContext.routeDataMap[route.id] ??= [];
      versionContext.routeDataMap[route.id]!.push(...result.outputs);

      await materializeOutputs({
        outputs: context.data.outputs,
        version,
        routeId: route.id,
        file,
        values: result.outputs,
        emitTrace: context.emitTrace,
        definitions: context.config.routeOutputs.get(route.id) ?? DEFAULT_FALLBACK_OUTPUTS,
        runtime: context.config.runtime,
      });
    } catch (error) {
      await emitPipelineError(context, {
        scope: "route",
        message: error instanceof Error ? error.message : String(error),
        error,
        file,
        routeId: route.id,
        version,
      });
    }
  });
}

async function executeUnmatchedFile(
  context: RunContext,
  versionContext: VersionContext,
  version: string,
  versionSpanId: string,
  file: FileContext,
): Promise<void> {
  const { pipeline, logger } = context.config;

  if (!pipeline.fallback) {
    context.data.summary.skippedFiles++;
    if (pipeline.strict) {
      await emitPipelineError(context, {
        scope: "file",
        message: `No matching route for file: ${file.path}`,
        file,
        version,
      });
      return;
    }

    await emitTraceInSpan(context, versionSpanId, {
      kind: "file.skipped",
      file,
      reason: "no-match",
      version,
    });
    return;
  }

  if (pipeline.fallback.filter && !pipeline.fallback.filter({ file, logger, source: isSourceFileContext(file) ? file.source : undefined })) {
    context.data.summary.skippedFiles++;
    await emitTraceInSpan(context, versionSpanId, {
      kind: "file.skipped",
      file,
      reason: "filtered",
      version,
    });
    return;
  }

  context.data.summary.fallbackFiles++;
  await executeFallbackFile(context, versionContext, version, file);
}

async function executeFallbackFile(
  context: RunContext,
  versionContext: VersionContext,
  version: string,
  file: FileContext,
): Promise<void> {
  const spanId = context.config.traces.nextSpanId();

  await emitTraceInSpan(context, spanId, { kind: "source.provided", version, file });
  await emitTraceInSpan(context, spanId, { kind: "file.fallback", version, file });

  try {
    const outputs = await context.config.runtime.withSpan(spanId, () => processFallback({
      file,
      fallback: context.config.pipeline.fallback!,
      routeDataMap: versionContext.routeDataMap,
      runtime: context.config.runtime,
      source: context.config.source,
      version,
      emitTrace: (trace: PipelineTraceEmitInput) => context.emitTrace(trace),
      spanId: context.config.traces.nextSpanId,
    }));

    await materializeOutputs({
      outputs: context.data.outputs,
      version,
      routeId: "__fallback__",
      file,
      values: outputs,
      emitTrace: context.emitTrace,
      definitions: DEFAULT_FALLBACK_OUTPUTS,
      runtime: context.config.runtime,
    });
  } catch (error) {
    await emitPipelineError(context, {
      scope: "file",
      message: error instanceof Error ? error.message : String(error),
      error,
      file,
      version,
    });
  }
}

async function loadRouteResult(
  context: RunContext,
  version: string,
  route: RouteDef,
  file: FileContext,
  spanId: string,
  routeDataMap: Record<string, unknown[]>,
): Promise<{ outputs: unknown[] }> {
  const { cacheStore, runtime, source, traces, useCache } = context.config;
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

    await recordCacheHitOrMiss(context, version, route.id, file, cached.hit);
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
    emitTrace: (trace: PipelineTraceEmitInput) => context.emitTrace(trace),
    spanId: traces.nextSpanId,
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

    await storeCacheEntry({
      cacheStore,
      cacheKey,
      outputs: result.outputs,
    });
    await context.emitTrace({ kind: "cache.store", routeId: route.id, file, version });
  }

  return result;
}

async function recordCacheHitOrMiss(
  context: RunContext,
  version: string,
  routeId: string,
  file: FileContext,
  hit: boolean,
): Promise<void> {
  if (hit) {
    context.data.summary.cached++;
  }

  await context.emitTrace({ kind: hit ? "cache.hit" : "cache.miss", routeId, file, version });
}

function finalizeResult(context: RunContext, startTime: number): PipelineExecutionResult {
  const durationMs = performance.now() - startTime;
  const status: ExecutionStatus = context.data.errors.length === 0 ? "completed" : "failed";
  context.data.summary.totalOutputs = context.data.outputs.length;
  context.data.summary.durationMs = durationMs;

  const outputManifest: PipelineOutputManifestEntry[] = buildOutputManifestFromTraces(context.data.traceRecords);

  return {
    id: context.config.pipeline.id,
    data: context.data.outputs,
    outputManifest,
    traces: context.data.traceRecords,
    graph: buildExecutionGraphFromTraces(context.data.traceRecords),
    errors: context.data.errors,
    summary: context.data.summary,
    status,
  };
}

async function emitPipelineError(
  context: RunContext,
  error: PipelineError,
): Promise<void> {
  context.data.errors.push(error);
  await context.emitTrace({ kind: "error", error });
}

async function emitTraceInSpan(
  context: RunContext,
  spanId: string,
  trace: PipelineTraceEmitInput,
): Promise<PipelineTraceRecord> {
  return context.config.runtime.withSpan(spanId, () => context.emitTrace(trace));
}
