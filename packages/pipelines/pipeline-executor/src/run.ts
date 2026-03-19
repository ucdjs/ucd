import type {
  NormalizedRouteOutputDefinition,
  PipelineError,
  PipelineRouteDefinition,
} from "@ucdjs/pipelines-core";
import type { PipelineTraceEmitInput, PipelineTraceRecord, PipelineTraceRecordByKind } from "./traces";
import type { RunPipelineOptions } from "./run-types";
import { getExecutionLayers, normalizeRouteOutputs } from "@ucdjs/pipelines-core";
import { createPipelineLogger } from "./logger";
import { emitWithSpan } from "./events";
import {
  finalizePipelineResult,
  runVersion,
} from "./pipeline-run-phases";
import { createSourceAdapter } from "./source-files";

export async function runPipeline(options: RunPipelineOptions) {
  const { pipeline, runOptions = {}, cacheStore, artifacts, events, traces, priorResults = [], runtime } = options;
  const { cache: enableCache = true, versions: runVersions } = runOptions;
  const versionsToRun = runVersions ?? pipeline.versions;
  const useCache = enableCache && cacheStore != null;
  const startTime = performance.now();

  const logger = createPipelineLogger(runtime);
  const source = createSourceAdapter(pipeline, logger, { priorResults });
  const routeOutputDefinitions = new Map<string, readonly NormalizedRouteOutputDefinition[]>(
    pipeline.routes.map((route: PipelineRouteDefinition<any, any, any, any, any>) => [route.id, normalizeRouteOutputs(route)] as const),
  );
  const routesById = new Map<string, PipelineRouteDefinition<any, any, any, any, any>>(
    pipeline.routes.map((route: PipelineRouteDefinition<any, any, any, any, any>) => [route.id, route] as const),
  );
  const routesByLayer: PipelineRouteDefinition<any, any, any, any, any>[][] = getExecutionLayers(pipeline.dag)
    .map((layer) => layer.flatMap((routeId) => {
      const route = routesById.get(routeId);
      return route ? [route] : [];
    }));

  const traceRecords: PipelineTraceRecord[] = [];

  const context = {
    pipeline,
    cacheStore,
    globalArtifacts: artifacts,
    events,
    traces,
    runtime,
    source,
    logger,
    useCache,
    versionsToRun,
    routeOutputDefinitions,
    routesByLayer,
    outputs: [] as unknown[],
    traceRecords,
    errors: [] as PipelineError[],
    counters: {
      totalFiles: 0,
      totalRoutes: 0,
      cached: 0,
      matchedFiles: 0,
      skippedFiles: 0,
      fallbackFiles: 0,
    },
    async emitTrace<TTrace extends PipelineTraceEmitInput>(
      trace: TTrace,
    ): Promise<PipelineTraceRecordByKind<TTrace["kind"]>> {
      const record = await traces.emit({
        ...trace,
        pipelineId: pipeline.id,
      });
      traceRecords.push(record);
      return record;
    },
    async emitTraceWithSpan<TTrace extends PipelineTraceEmitInput>(
      spanId: string,
      trace: TTrace,
    ): Promise<PipelineTraceRecordByKind<TTrace["kind"]>> {
      return runtime.withSpan(spanId, () => context.emitTrace(trace));
    },
  };

  const pipelineSpanId = events.nextSpanId();
  await emitWithSpan(runtime, pipelineSpanId, () =>
    events.emit({
      type: "pipeline:start",
      versions: versionsToRun,
      spanId: pipelineSpanId,
      timestamp: performance.now(),
    }));

  for (const version of versionsToRun) {
    await runVersion(context, version);
  }

  await emitWithSpan(runtime, pipelineSpanId, () =>
    events.emit({
      type: "pipeline:end",
      durationMs: performance.now() - startTime,
      spanId: pipelineSpanId,
      timestamp: performance.now(),
    }));

  return finalizePipelineResult(context, startTime);
}
