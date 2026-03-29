import type { FileContext } from "../types";
import type { PipelineError } from "./events";

export type PipelineTraceKind
  = | "pipeline"
    | "version"
    | "source.provided"
    | "source.listing"
    | "file.route"
    | "file.matched"
    | "file.fallback"
    | "file.skipped"
    | "file.queued"
    | "file.dequeued"
    | "parse"
    | "resolve"
    | "cache.hit"
    | "cache.miss"
    | "cache.store"
    | "output.produced"
    | "output"
    | "output.written"
    | "dependency.resolve"
    | "error"
    | (string & {});

interface PipelineTraceBase<TKind extends PipelineTraceKind> {
  id: string;
  kind: TKind;
  pipelineId: string;
  traceId: string;
  spanId?: string;
  parentSpanId?: string;
  timestamp: number;
  schemaVersion?: number;
}

export interface PipelineSpanRecord extends PipelineTraceBase<"pipeline"> {
  versions: string[];
  startTimestamp: number;
  durationMs: number;
}

export interface VersionSpanRecord extends PipelineTraceBase<"version"> {
  version: string;
  startTimestamp: number;
  durationMs: number;
}

export interface SourceProvidedTraceRecord extends PipelineTraceBase<"source.provided"> {
  version: string;
  file?: FileContext;
}

export interface SourceListingSpanRecord extends PipelineTraceBase<"source.listing"> {
  version: string;
  fileCount: number;
  startTimestamp: number;
  durationMs: number;
}

export interface FileRouteSpanRecord extends PipelineTraceBase<"file.route"> {
  version: string;
  file: FileContext;
  routeId: string;
  startTimestamp: number;
  durationMs: number;
}

export interface FileMatchedTraceRecord extends PipelineTraceBase<"file.matched"> {
  version: string;
  file: FileContext;
  routeId: string;
}

export interface FileFallbackTraceRecord extends PipelineTraceBase<"file.fallback"> {
  version: string;
  file: FileContext;
}

export interface FileSkippedTraceRecord extends PipelineTraceBase<"file.skipped"> {
  version: string;
  file: FileContext;
  reason: "no-match" | "filtered";
}

export interface FileQueuedTraceRecord extends PipelineTraceBase<"file.queued"> {
  version: string;
  file: FileContext;
  routeId: string;
}

export interface FileDequeuedTraceRecord extends PipelineTraceBase<"file.dequeued"> {
  version: string;
  file: FileContext;
  routeId: string;
  waitDurationMs: number;
}

export interface ParseSpanRecord extends PipelineTraceBase<"parse"> {
  version: string;
  file: FileContext;
  routeId: string;
  rowCount: number;
  filteredRowCount: number;
  startTimestamp: number;
  durationMs: number;
}

export interface ResolveSpanRecord extends PipelineTraceBase<"resolve"> {
  version: string;
  file: FileContext;
  routeId: string;
  outputCount: number;
  startTimestamp: number;
  durationMs: number;
}

export interface CacheHitTraceRecord extends PipelineTraceBase<"cache.hit"> {
  version: string;
  routeId: string;
  file: FileContext;
}

export interface CacheMissTraceRecord extends PipelineTraceBase<"cache.miss"> {
  version: string;
  routeId: string;
  file: FileContext;
}

export interface CacheStoreTraceRecord extends PipelineTraceBase<"cache.store"> {
  version: string;
  routeId: string;
  file: FileContext;
}

export type CacheTraceRecord = CacheHitTraceRecord | CacheMissTraceRecord | CacheStoreTraceRecord;

export interface OutputProducedTraceRecord extends PipelineTraceBase<"output.produced"> {
  version: string;
  routeId: string;
  file?: FileContext;
  outputIndex: number;
  property?: string;
}

export interface OutputTraceRecord extends PipelineTraceBase<"output"> {
  version: string;
  routeId: string;
  file: FileContext;
  outputIndex: number;
  outputId: string;
  property?: string;
  sink: string;
  format: "json" | "text";
  locator: string;
}

export interface OutputWrittenTraceRecord extends PipelineTraceBase<"output.written"> {
  version: string;
  routeId: string;
  file: FileContext;
  outputIndex: number;
  outputId: string;
  property?: string;
  sink: string;
  locator: string;
  status: "written" | "failed";
  error?: string;
}

export interface DependencyResolveTraceRecord extends PipelineTraceBase<"dependency.resolve"> {
  version: string;
  file: FileContext;
  routeId: string;
  dependsOnRouteId: string;
  status: "resolved" | "missing";
}

export interface ErrorTraceRecord extends PipelineTraceBase<"error"> {
  error: PipelineError;
  stack?: string;
}

export type PipelineTraceRecord
  = | PipelineSpanRecord
    | VersionSpanRecord
    | SourceProvidedTraceRecord
    | SourceListingSpanRecord
    | FileRouteSpanRecord
    | FileMatchedTraceRecord
    | FileFallbackTraceRecord
    | FileSkippedTraceRecord
    | FileQueuedTraceRecord
    | FileDequeuedTraceRecord
    | ParseSpanRecord
    | ResolveSpanRecord
    | CacheHitTraceRecord
    | CacheMissTraceRecord
    | CacheStoreTraceRecord
    | OutputProducedTraceRecord
    | OutputTraceRecord
    | OutputWrittenTraceRecord
    | DependencyResolveTraceRecord
    | ErrorTraceRecord;

export type PipelineTraceRecordByKind<TKind extends PipelineTraceKind>
  = Extract<PipelineTraceRecord, { kind: TKind }>;

export type PipelineTraceInput = {
  [K in PipelineTraceKind]: Omit<PipelineTraceRecordByKind<K>, "id" | "traceId" | "spanId" | "parentSpanId" | "timestamp">;
}[PipelineTraceKind];

export type PipelineTraceEmitInput = {
  [K in PipelineTraceKind]: Omit<PipelineTraceRecordByKind<K>, "id" | "traceId" | "spanId" | "parentSpanId" | "timestamp" | "pipelineId">;
}[PipelineTraceKind];

export interface PipelineOutputManifestEntry {
  outputIndex: number;
  outputId: string;
  routeId: string;
  pipelineId: string;
  version: string;
  property?: string;
  sink: string;
  format: "json" | "text";
  locator: string;
  status: "resolved" | "written" | "failed";
  error?: string;
}
