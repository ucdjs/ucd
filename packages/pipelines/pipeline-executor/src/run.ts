import type { PipelineArtifactDefinition } from "@ucdjs/pipelines-artifacts";
import type {
  AnyPipelineDefinition,
  FileContext,
  NormalizedRouteOutputDefinition,
  PipelineError,
  PipelineEventInput,
  PipelineLogger,
  PipelineRouteDefinition,
  SourceFileContext,
} from "@ucdjs/pipelines-core";
import type { CacheStore } from "./cache";
import type { EventEmitter } from "./run/events";
import type { PipelineExecutionRuntime } from "./runtime";
import type {
  PipelineOutputManifestEntry,
  PipelineTraceEmitInput,
  PipelineTraceRecord,
  PipelineTraceRecordByKind,
} from "./run/traces";
import type { SourceAdapter } from "./run/source-files";
import type { TraceEmitter } from "./run/trace-emitter";
import type {
  ExecutionStatus,
  PipelineExecutionResult,
  PipelineExecutorRunOptions,
  PipelineSummary,
} from "./types";
import { getExecutionLayers, normalizeRouteOutputs } from "@ucdjs/pipelines-core";
import { emitRuntimeEvent } from "./run/events";
import { buildExecutionGraphFromTraces } from "./run/graph";
import { createPipelineLogger } from "./run/logger";
import { DEFAULT_FALLBACK_OUTPUTS, materializeOutputs } from "./run/outputs";
import {
  buildOutputManifestFromTraces,
} from "./run/traces";
import { runGlobalArtifacts, traceRouteArtifacts } from "./run/artifacts";
import { buildCacheKey, storeCacheEntry, tryLoadCachedResult } from "./run/cache-helpers";
import { createProcessingQueue } from "./run/processing-queue";
import { processFallback, processRoute, recordEmittedArtifacts } from "./run/route-runtime";
import { createSourceAdapter } from "./run/source-files";

type RouteDef = PipelineRouteDefinition<any, any, any, any, any>;

export interface RunPipelineOptions {
  pipeline: AnyPipelineDefinition;
  runOptions?: PipelineExecutorRunOptions;
  cacheStore?: CacheStore;
  artifacts: PipelineArtifactDefinition[];
  events: EventEmitter;
  traces: TraceEmitter;
  priorResults?: PipelineExecutionResult[];
  runtime: PipelineExecutionRuntime;
}

export interface RunConfig {
  pipeline: AnyPipelineDefinition;
  cacheStore?: CacheStore;
  artifacts: PipelineArtifactDefinition[];
  events: EventEmitter;
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
  emitTrace: <TTrace extends PipelineTraceEmitInput>(
    trace: TTrace,
  ) => Promise<PipelineTraceRecordByKind<TTrace["kind"]>>;
}

interface VersionContext {
  version: string;
  artifactsMap: Record<string, unknown>;
  globalArtifactsMap: Record<string, unknown>;
  listFiles: () => Promise<FileContext[]>;
}

export async function run(options: RunPipelineOptions): Promise<PipelineExecutionResult> {
  const startTime = performance.now();
  const context = createRunContext(options);
  const spanId = context.config.events.nextSpanId();

  await emitEvent(context, spanId, {
    type: "pipeline:start",
    versions: context.config.versions,
    spanId,
    timestamp: performance.now(),
  });

  for (const version of context.config.versions) {
    await runVersion(context, version);
  }

  await emitEvent(context, spanId, {
    type: "pipeline:end",
    durationMs: performance.now() - startTime,
    spanId,
    timestamp: performance.now(),
  });

  return finalizeResult(context, startTime);
}

export function resolveVersions(
  pipeline: AnyPipelineDefinition,
  runOptions: PipelineExecutorRunOptions = {},
): string[] {
  return runOptions.versions ?? pipeline.versions;
}

export function buildRoutesByLayer(
  pipeline: AnyPipelineDefinition,
): RouteDef[][] {
  const routesById = new Map<string, RouteDef>(
    pipeline.routes.map((route: RouteDef) => [route.id, route] as const),
  );

  return getExecutionLayers(pipeline.dag).map((layer) => {
    return layer.reduce<RouteDef[]>((routes, id) => {
      const route = routesById.get(id);
      if (route) {
        routes.push(route);
      }
      return routes;
    }, []);
  });
}

export function buildRouteOutputs(
  pipeline: AnyPipelineDefinition,
): Map<string, readonly NormalizedRouteOutputDefinition[]> {
  return new Map(
    pipeline.routes.map((route: RouteDef) => [route.id, normalizeRouteOutputs(route)] as const),
  );
}

export function createSummary(versions: string[]): PipelineSummary {
  return {
    versions,
    totalRoutes: 0,
    cached: 0,
    totalFiles: 0,
    matchedFiles: 0,
    skippedFiles: 0,
    fallbackFiles: 0,
    totalOutputs: 0,
    durationMs: 0,
  };
}

export function createRunContext(options: RunPipelineOptions): RunContext {
  const { pipeline, runOptions = {}, cacheStore, artifacts, events, traces, priorResults = [], runtime } = options;
  const versions = resolveVersions(pipeline, runOptions);
  const logger = createPipelineLogger(runtime);

  const config: RunConfig = {
    pipeline,
    cacheStore,
    artifacts,
    events,
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

  const emitTrace = async <TTrace extends PipelineTraceEmitInput>(
    trace: TTrace,
  ): Promise<PipelineTraceRecordByKind<TTrace["kind"]>> => {
    const record = await config.traces.emit({ ...trace, pipelineId: config.pipeline.id });
    data.traceRecords.push(record);
    return record;
  };

  return { config, data, emitTrace };
}

function createVersionContext(
  context: RunContext,
  version: string,
): VersionContext {
  let files: FileContext[] | null = null;

  return {
    version,
    artifactsMap: {},
    globalArtifactsMap: {},
    listFiles: async () => {
      files ??= await context.config.source.listFiles(version);
      return files;
    },
  };
}

async function runVersion(context: RunContext, version: string): Promise<void> {
  const startTime = performance.now();
  const spanId = context.config.events.nextSpanId();
  const versionContext = createVersionContext(context, version);

  await emitEvent(context, spanId, {
    type: "version:start",
    version,
    spanId,
    timestamp: performance.now(),
  });

  await runGlobalArtifacts({
    artifacts: context.config.artifacts,
    version,
    state: versionContext,
    logger: context.config.logger,
    source: context.config.source,
    runtime: context.config.runtime,
    events: context.config.events,
    emitTrace: context.emitTrace,
    onError: (errorSpanId, error) => emitPipelineError(context, errorSpanId, error),
  });

  const files = await versionContext.listFiles();
  const includedFiles = context.config.pipeline.include
    ? files.filter((file) => context.config.pipeline.include!({ file, logger: context.config.logger }))
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

  await emitEvent(context, spanId, {
    type: "version:end",
    version,
    durationMs: performance.now() - startTime,
    spanId,
    timestamp: performance.now(),
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
      source: (file as SourceFileContext).source,
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
  const spanId = context.config.events.nextSpanId();
  context.data.summary.matchedFiles++;

  await emitTraceInSpan(context, spanId, { kind: "source.provided", version, file });
  await emitTraceInSpan(context, spanId, { kind: "file.matched", version, file, routeId: route.id });
  await emitEvent(context, spanId, {
    type: "file:matched",
    file,
    routeId: route.id,
    spanId,
    timestamp: performance.now(),
  });

  await context.config.runtime.withSpan(spanId, async () => {
    try {
      const artifactsMap = {
        ...versionContext.artifactsMap,
        ...versionContext.globalArtifactsMap,
      };

      const result = await loadRouteResult(
        context,
        version,
        route,
        file,
        spanId,
        artifactsMap,
      );

      recordEmittedArtifacts({
        routeId: route.id,
        emittedArtifacts: result.emittedArtifacts,
        routeEmits: route.emits,
        artifactsMap: versionContext.artifactsMap,
        globalArtifactsMap: versionContext.globalArtifactsMap,
      });

      await traceRouteArtifacts({
        emitTrace: context.emitTrace,
        version,
        routeId: route.id,
        consumedArtifactIds: result.consumedArtifactIds,
        emittedArtifacts: result.emittedArtifacts,
      });

      await materializeOutputs({
        outputs: context.data.outputs,
        version,
        routeId: route.id,
        file,
        values: result.outputs,
        emitTrace: context.emitTrace,
        definitions: context.config.routeOutputs.get(route.id) ?? DEFAULT_FALLBACK_OUTPUTS,
      });
    } catch (error) {
      await emitPipelineError(context, spanId, {
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
      await emitPipelineError(context, versionSpanId, {
        scope: "file",
        message: `No matching route for file: ${file.path}`,
        file,
        version,
      });
      return;
    }

    await emitEvent(context, versionSpanId, {
      type: "file:skipped",
      file,
      reason: "no-match",
      spanId: versionSpanId,
      timestamp: performance.now(),
    });
    return;
  }

  if (pipeline.fallback.filter && !pipeline.fallback.filter({ file, logger })) {
    context.data.summary.skippedFiles++;
    await emitEvent(context, versionSpanId, {
      type: "file:skipped",
      file,
      reason: "filtered",
      spanId: versionSpanId,
      timestamp: performance.now(),
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
  const spanId = context.config.events.nextSpanId();

  await emitTraceInSpan(context, spanId, { kind: "source.provided", version, file });
  await emitTraceInSpan(context, spanId, { kind: "file.fallback", version, file });
  await emitEvent(context, spanId, {
    type: "file:fallback",
    file,
    spanId,
    timestamp: performance.now(),
  });

  try {
    const outputs = await context.config.runtime.withSpan(spanId, () => processFallback({
      file,
      fallback: context.config.pipeline.fallback!,
      artifactsMap: {
        ...versionContext.artifactsMap,
        ...versionContext.globalArtifactsMap,
      },
      runtime: context.config.runtime,
      source: context.config.source,
      version,
      emit: (event: PipelineEventInput) => context.config.events.emit({ ...event, spanId }),
      spanId: context.config.events.nextSpanId,
    }));

    await materializeOutputs({
      outputs: context.data.outputs,
      version,
      routeId: "__fallback__",
      file,
      values: outputs,
      emitTrace: context.emitTrace,
      definitions: DEFAULT_FALLBACK_OUTPUTS,
    });
  } catch (error) {
    await emitPipelineError(context, spanId, {
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
  artifactsMap: Record<string, unknown>,
) {
  const { cacheStore, runtime, source, events, useCache } = context.config;
  const routeCacheEnabled = useCache && route.cache !== false;
  let fileContent: string | undefined;

  if (routeCacheEnabled && cacheStore) {
    fileContent = await source.readFile(file);
    const cached = await tryLoadCachedResult({
      cacheStore,
      routeId: route.id,
      version,
      fileContent,
      artifactsMap,
    });

    await recordCacheHitOrMiss(context, version, route.id, file, spanId, cached.hit);
    if (cached.hit && cached.result) {
      return cached.result;
    }
  }

  const result = await processRoute({
    file,
    route,
    artifactsMap,
    runtime,
    source,
    version,
    emit: (event: PipelineEventInput) => events.emit({ ...event, spanId }),
    spanId: events.nextSpanId,
  });

  if (routeCacheEnabled && cacheStore) {
    fileContent ??= await source.readFile(file);
    const cacheKey = await buildCacheKey(
      route.id,
      version,
      fileContent,
      artifactsMap,
      result.consumedArtifactIds,
    );

    await storeCacheEntry({
      cacheStore,
      cacheKey,
      outputs: result.outputs,
      emittedArtifacts: result.emittedArtifacts,
    });
    await context.emitTrace({ kind: "cache.store", routeId: route.id, file, version });
    await events.emit({
      type: "cache:store",
      routeId: route.id,
      file,
      version,
      spanId,
      timestamp: performance.now(),
    });
  }

  return result;
}

async function recordCacheHitOrMiss(
  context: RunContext,
  version: string,
  routeId: string,
  file: FileContext,
  spanId: string,
  hit: boolean,
): Promise<void> {
  if (hit) {
    context.data.summary.cached++;
  }

  await context.emitTrace({ kind: hit ? "cache.hit" : "cache.miss", routeId, file, version });
  await context.config.events.emit({
    type: hit ? "cache:hit" : "cache:miss",
    routeId,
    file,
    version,
    spanId,
    timestamp: performance.now(),
  });
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
  spanId: string,
  error: PipelineError,
): Promise<void> {
  context.data.errors.push(error);
  await context.config.events.emit({
    type: "error",
    error,
    spanId,
    timestamp: performance.now(),
  });
}

async function emitEvent(
  context: RunContext,
  spanId: string,
  event: PipelineEventInput,
): Promise<void> {
  await emitRuntimeEvent(context.config.runtime, context.config.events, spanId, event);
}

async function emitTraceInSpan<TTrace extends PipelineTraceEmitInput>(
  context: RunContext,
  spanId: string,
  trace: TTrace,
): Promise<PipelineTraceRecordByKind<TTrace["kind"]>> {
  return context.config.runtime.withSpan(spanId, () => context.emitTrace(trace));
}
