import type { PipelineArtifactDefinition } from "@ucdjs/pipelines-artifacts";
import type {
  AnyPipelineDefinition,
  FileContext,
  NormalizedRouteOutputDefinition,
  PipelineError,
  PipelineEventInput,
  PipelineRouteDefinition,
  SourceFileContext,
} from "@ucdjs/pipelines-core";
import type { CacheStore } from "./cache";
import type { EventEmitter } from "./events";
import type { PipelineExecutionRuntime } from "./runtime";
import type { SourceAdapter } from "./source-files";
import type {
  PipelineOutputManifestEntry,
  PipelineTraceEmitInput,
  PipelineTraceRecord,
  PipelineTraceRecordByKind,
} from "./traces";
import type {
  ExecutionStatus,
  PipelineExecutionResult,
  PipelineExecutorRunOptions,
  PipelineSummary,
} from "./types";
import { getExecutionLayers, normalizeRouteOutputs } from "@ucdjs/pipelines-core";
import { runGlobalArtifacts, traceRouteArtifacts } from "./artifacts";
import { buildCacheKey, storeCacheEntry, tryLoadCachedResult } from "./cache-helpers";
import { emitWithSpan } from "./events";
import { buildExecutionGraphFromTraces } from "./graph";
import { createPipelineLogger } from "./logger";
import { materializeOutputs } from "./outputs";
import { createProcessingQueue } from "./processing-queue";
import { processFallback, processRoute, recordEmittedArtifacts } from "./route-runtime";
import { createSourceAdapter } from "./source-files";
import { buildOutputManifestFromTraces } from "./traces";
import type { TraceEmitter } from "./trace-emitter";

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

interface RunState {
  pipeline: AnyPipelineDefinition;
  cacheStore?: CacheStore;
  artifacts: PipelineArtifactDefinition[];
  events: EventEmitter;
  traces: TraceEmitter;
  runtime: PipelineExecutionRuntime;
  source: SourceAdapter;
  logger: ReturnType<typeof createPipelineLogger>;
  useCache: boolean;
  versions: string[];
  routesByLayer: RouteDef[][];
  routeOutputs: Map<string, readonly NormalizedRouteOutputDefinition[]>;
  outputs: unknown[];
  traceRecords: PipelineTraceRecord[];
  errors: PipelineError[];
  summary: PipelineSummary;
  emitTrace: <TTrace extends PipelineTraceEmitInput>(
    trace: TTrace,
  ) => Promise<PipelineTraceRecordByKind<TTrace["kind"]>>;
  emitTraceWithSpan: <TTrace extends PipelineTraceEmitInput>(
    spanId: string,
    trace: TTrace,
  ) => Promise<PipelineTraceRecordByKind<TTrace["kind"]>>;
}

interface VersionState {
  artifactsMap: Record<string, unknown>;
  globalArtifactsMap: Record<string, unknown>;
  listFiles: () => Promise<FileContext[]>;
}

const FALLBACK_OUTPUTS: readonly NormalizedRouteOutputDefinition[] = [{ id: "fallback-output", format: "json" }];

export async function run(options: RunPipelineOptions): Promise<PipelineExecutionResult> {
  const startTime = performance.now();
  const state = createRunState(options);
  const spanId = state.events.nextSpanId();

  await emitEvent(state, spanId, {
    type: "pipeline:start",
    versions: state.versions,
    spanId,
    timestamp: performance.now(),
  });

  for (const version of state.versions) {
    await runVersion(state, version);
  }

  await emitEvent(state, spanId, {
    type: "pipeline:end",
    durationMs: performance.now() - startTime,
    spanId,
    timestamp: performance.now(),
  });

  return finalizeResult(state, startTime);
}

function createRunState(options: RunPipelineOptions): RunState {
  const { pipeline, runOptions = {}, cacheStore, artifacts, events, traces, priorResults = [], runtime } = options;
  const versions = runOptions.versions ?? pipeline.versions;
  const logger = createPipelineLogger(runtime);
  const traceRecords: PipelineTraceRecord[] = [];
  const routesById: Map<string, RouteDef> = new Map(
    pipeline.routes.map((route: RouteDef) => [route.id, route] as const),
  );
  const routesByLayer: RouteDef[][] = getExecutionLayers(pipeline.dag).map((layer) => {
    return layer.reduce<RouteDef[]>((routes, id) => {
      const route = routesById.get(id);
      if (route) {
        routes.push(route);
      }
      return routes;
    }, []);
  });
  const routeOutputs = new Map<string, readonly NormalizedRouteOutputDefinition[]>(
    pipeline.routes.map((route: RouteDef) => [route.id, normalizeRouteOutputs(route)] as const),
  );

  let state!: RunState;
  state = {
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
    routesByLayer,
    routeOutputs,
    outputs: [],
    traceRecords,
    errors: [],
    summary: {
      versions,
      totalRoutes: 0,
      cached: 0,
      totalFiles: 0,
      matchedFiles: 0,
      skippedFiles: 0,
      fallbackFiles: 0,
      totalOutputs: 0,
      durationMs: 0,
    },
    async emitTrace<TTrace extends PipelineTraceEmitInput>(trace: TTrace) {
      const record = await traces.emit({ ...trace, pipelineId: pipeline.id });
      traceRecords.push(record);
      return record;
    },
    async emitTraceWithSpan<TTrace extends PipelineTraceEmitInput>(
      spanId: string,
      trace: TTrace,
    ): Promise<PipelineTraceRecordByKind<TTrace["kind"]>> {
      return runtime.withSpan(spanId, () => state.emitTrace(trace));
    },
  } satisfies RunState;

  return state;
}

function createVersionState(state: RunState, version: string): VersionState {
  let files: FileContext[] | null = null;
  return {
    artifactsMap: {},
    globalArtifactsMap: {},
    listFiles: async () => {
      files ??= await state.source.listFiles(version);
      return files;
    },
  };
}

async function runVersion(state: RunState, version: string): Promise<void> {
  const startTime = performance.now();
  const spanId = state.events.nextSpanId();
  const versionState = createVersionState(state, version);

  await emitEvent(state, spanId, {
    type: "version:start",
    version,
    spanId,
    timestamp: performance.now(),
  });

  await runGlobalArtifacts({
    artifacts: state.artifacts,
    version,
    state: versionState,
    logger: state.logger,
    source: state.source,
    runtime: state.runtime,
    events: state.events,
    emitTraceWithSpan: state.emitTraceWithSpan,
    onError: (spanId, error) => emitPipelineError(state, spanId, error),
  });
  const files = await versionState.listFiles();
  const includedFiles = state.pipeline.include ? files.filter((file) => state.pipeline.include!({ file, logger: state.logger })) : files;
  const processedFiles = new Set<string>();
  state.summary.totalFiles += files.length;

  for (const routes of state.routesByLayer) {
    const queue = createProcessingQueue(state.pipeline.concurrency);
    for (const route of routes) {
      for (const file of selectMatchingFiles(state, route, includedFiles)) {
        processedFiles.add(file.path);
        state.summary.totalRoutes++;
        await queue.add(() => executeMatchedFile(state, versionState, version, route, file));
      }
    }
    await queue.drain();
  }

  for (const file of includedFiles) {
    if (processedFiles.has(file.path)) {
      continue;
    }
    await executeUnmatchedFile(state, versionState, version, spanId, file);
  }

  await emitEvent(state, spanId, {
    type: "version:end",
    version,
    durationMs: performance.now() - startTime,
    spanId,
    timestamp: performance.now(),
  });
}

function selectMatchingFiles(state: RunState, route: RouteDef, files: readonly FileContext[]): FileContext[] {
  return files.filter((file) => route.filter({ file, logger: state.logger, source: (file as SourceFileContext).source }));
}

async function executeMatchedFile(
  state: RunState,
  versionState: VersionState,
  version: string,
  route: RouteDef,
  file: FileContext,
): Promise<void> {
  const spanId = state.events.nextSpanId();
  state.summary.matchedFiles++;

  await state.emitTraceWithSpan(spanId, { kind: "source.provided", version, file });
  await state.emitTraceWithSpan(spanId, { kind: "file.matched", version, file, routeId: route.id });
  await emitEvent(state, spanId, { type: "file:matched", file, routeId: route.id, spanId, timestamp: performance.now() });

  await state.runtime.withSpan(spanId, async () => {
    try {
      const artifacts = { ...versionState.artifactsMap, ...versionState.globalArtifactsMap };
      const result = await loadRouteResult(state, version, route, file, spanId, artifacts);
      recordEmittedArtifacts({ routeId: route.id, emittedArtifacts: result.emittedArtifacts, routeEmits: route.emits, artifactsMap: versionState.artifactsMap, globalArtifactsMap: versionState.globalArtifactsMap });
      await traceRouteArtifacts({
        emitTrace: state.emitTrace,
        version,
        routeId: route.id,
        consumedArtifactIds: result.consumedArtifactIds,
        emittedArtifacts: result.emittedArtifacts,
      });
      await materializeOutputs({
        outputs: state.outputs,
        version,
        routeId: route.id,
        file,
        values: result.outputs,
        emitTrace: (trace) => state.emitTraceWithSpan(spanId, trace),
        definitions: state.routeOutputs.get(route.id) ?? FALLBACK_OUTPUTS,
      });
    } catch (error) {
      await emitPipelineError(state, spanId, {
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
  state: RunState,
  versionState: VersionState,
  version: string,
  versionSpanId: string,
  file: FileContext,
): Promise<void> {
  if (!state.pipeline.fallback) {
    state.summary.skippedFiles++;
    if (state.pipeline.strict) {
      await emitPipelineError(state, versionSpanId, { scope: "file", message: `No matching route for file: ${file.path}`, file, version });
      return;
    }
    await emitEvent(state, versionSpanId, { type: "file:skipped", file, reason: "no-match", spanId: versionSpanId, timestamp: performance.now() });
    return;
  }

  if (state.pipeline.fallback.filter && !state.pipeline.fallback.filter({ file, logger: state.logger })) {
    state.summary.skippedFiles++;
    await emitEvent(state, versionSpanId, { type: "file:skipped", file, reason: "filtered", spanId: versionSpanId, timestamp: performance.now() });
    return;
  }

  state.summary.fallbackFiles++;
  await executeFallbackFile(state, versionState, version, file);
}

async function executeFallbackFile(
  state: RunState,
  versionState: VersionState,
  version: string,
  file: FileContext,
): Promise<void> {
  const spanId = state.events.nextSpanId();

  await state.emitTraceWithSpan(spanId, { kind: "source.provided", version, file });
  await state.emitTraceWithSpan(spanId, { kind: "file.fallback", version, file });
  await emitEvent(state, spanId, { type: "file:fallback", file, spanId, timestamp: performance.now() });

  try {
    const outputs = await state.runtime.withSpan(spanId, () => processFallback({
      file,
      fallback: state.pipeline.fallback!,
      artifactsMap: { ...versionState.artifactsMap, ...versionState.globalArtifactsMap },
      runtime: state.runtime,
      source: state.source,
      version,
      emit: (event: PipelineEventInput) => state.events.emit({ ...event, spanId }),
      spanId: state.events.nextSpanId,
    }));

    await materializeOutputs({
      outputs: state.outputs,
      version,
      routeId: "__fallback__",
      file,
      values: outputs,
      emitTrace: (trace) => state.emitTraceWithSpan(spanId, trace),
      definitions: FALLBACK_OUTPUTS,
    });
  } catch (error) {
    await emitPipelineError(state, spanId, {
      scope: "file",
      message: error instanceof Error ? error.message : String(error),
      error,
      file,
      version,
    });
  }
}

async function loadRouteResult(
  state: RunState,
  version: string,
  route: RouteDef,
  file: FileContext,
  spanId: string,
  artifactsMap: Record<string, unknown>,
) {
  const routeCacheEnabled = state.useCache && route.cache !== false;
  let fileContent: string | undefined;

  if (routeCacheEnabled && state.cacheStore) {
    fileContent = await state.source.readFile(file);
    const cached = await tryLoadCachedResult({ cacheStore: state.cacheStore, routeId: route.id, version, fileContent, artifactsMap });
    await recordCacheHitOrMiss(state, version, route.id, file, spanId, cached.hit);
    if (cached.hit && cached.result) {
      return cached.result;
    }
  }

  const result = await processRoute({
    file,
    route,
    artifactsMap,
    runtime: state.runtime,
    source: state.source,
    version,
    emit: (event: PipelineEventInput) => state.events.emit({ ...event, spanId }),
    spanId: state.events.nextSpanId,
  });

  if (routeCacheEnabled && state.cacheStore) {
    fileContent ??= await state.source.readFile(file);
    const cacheKey = await buildCacheKey(route.id, version, fileContent, artifactsMap, result.consumedArtifactIds);
    await storeCacheEntry({ cacheStore: state.cacheStore, cacheKey, outputs: result.outputs, emittedArtifacts: result.emittedArtifacts });
    await state.emitTrace({ kind: "cache.store", routeId: route.id, file, version });
    await state.events.emit({ type: "cache:store", routeId: route.id, file, version, spanId, timestamp: performance.now() });
  }

  return result;
}

async function recordCacheHitOrMiss(
  state: RunState,
  version: string,
  routeId: string,
  file: FileContext,
  spanId: string,
  hit: boolean,
): Promise<void> {
  if (hit) {
    state.summary.cached++;
  }
  await state.emitTrace({ kind: hit ? "cache.hit" : "cache.miss", routeId, file, version });
  await state.events.emit({ type: hit ? "cache:hit" : "cache:miss", routeId, file, version, spanId, timestamp: performance.now() });
}

function finalizeResult(state: RunState, startTime: number): PipelineExecutionResult {
  const durationMs = performance.now() - startTime;
  const status: ExecutionStatus = state.errors.length === 0 ? "completed" : "failed";
  state.summary.totalOutputs = state.outputs.length;
  state.summary.durationMs = durationMs;

  const outputManifest: PipelineOutputManifestEntry[] = buildOutputManifestFromTraces(state.traceRecords);
  return {
    id: state.pipeline.id,
    data: state.outputs,
    outputManifest,
    traces: state.traceRecords,
    graph: buildExecutionGraphFromTraces(state.traceRecords),
    errors: state.errors,
    summary: state.summary,
    status,
  };
}

async function emitPipelineError(state: RunState, spanId: string, error: PipelineError): Promise<void> {
  state.errors.push(error);
  await state.events.emit({ type: "error", error, spanId, timestamp: performance.now() });
}

async function emitEvent(state: RunState, spanId: string, event: PipelineEventInput): Promise<void> {
  await emitWithSpan(state.runtime, spanId, () => state.events.emit(event));
}
