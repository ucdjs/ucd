import type { PipelineArtifactDefinition } from "@ucdjs/pipelines-artifacts";
import type {
  AnyPipelineDefinition,
  NormalizedRouteOutputDefinition,
  PipelineError,
  PipelineLogger,
  PipelineRouteDefinition,
} from "@ucdjs/pipelines-core";
import type { CacheStore } from "../cache";
import type { PipelineExecutionRuntime } from "../runtime";
import type {
  PipelineTraceEmitInput,
  PipelineTraceRecord,
  PipelineTraceRecordByKind,
} from "../traces";
import type {
  PipelineExecutionResult,
  PipelineExecutorRunOptions,
} from "../types";
import type { EventEmitter } from "./events";
import type { SourceAdapter } from "./source-adapter";
import type { TraceEmitter } from "./trace-emitter";

export interface PipelineRunCounters {
  totalFiles: number;
  totalRoutes: number;
  cached: number;
  matchedFiles: number;
  skippedFiles: number;
  fallbackFiles: number;
}

export interface PipelineRunContext {
  pipeline: AnyPipelineDefinition;
  cacheStore?: CacheStore;
  globalArtifacts: PipelineArtifactDefinition[];
  events: EventEmitter;
  traces: TraceEmitter;
  runtime: PipelineExecutionRuntime;
  source: SourceAdapter;
  logger: PipelineLogger;
  useCache: boolean;
  versionsToRun: string[];
  routeOutputDefinitions: Map<string, readonly NormalizedRouteOutputDefinition[]>;
  routesByLayer: PipelineRouteDefinition<any, any, any, any, any>[][];
  outputs: unknown[];
  traceRecords: PipelineTraceRecord[];
  errors: PipelineError[];
  counters: PipelineRunCounters;
  emitTrace: <TTrace extends PipelineTraceEmitInput>(
    trace: TTrace,
  ) => Promise<PipelineTraceRecordByKind<TTrace["kind"]>>;
  emitTraceWithSpan: <TTrace extends PipelineTraceEmitInput>(
    spanId: string,
    trace: TTrace,
  ) => Promise<PipelineTraceRecordByKind<TTrace["kind"]>>;
}

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
