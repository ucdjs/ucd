import type { FileContext } from "../types";
import type { PipelineError } from "./events";

export type PipelineTraceKind
  = | "pipeline.start"
    | "pipeline.end"
    | "version.start"
    | "version.end"
    | "source.provided"
    | "file.matched"
    | "file.fallback"
    | "file.skipped"
    | "parse.start"
    | "parse.end"
    | "resolve.start"
    | "resolve.end"
    | "cache.hit"
    | "cache.miss"
    | "cache.store"
    | "output.produced"
    | "output.resolved"
    | "output.written"
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
}

export interface PipelineStartTraceRecord extends PipelineTraceBase<"pipeline.start"> {
  versions: string[];
}

export interface PipelineEndTraceRecord extends PipelineTraceBase<"pipeline.end"> {
  durationMs: number;
}

export interface VersionStartTraceRecord extends PipelineTraceBase<"version.start"> {
  version: string;
}

export interface VersionEndTraceRecord extends PipelineTraceBase<"version.end"> {
  version: string;
  durationMs: number;
}

export interface SourceProvidedTraceRecord extends PipelineTraceBase<"source.provided"> {
  version: string;
  file?: FileContext;
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

export interface ParseStartTraceRecord extends PipelineTraceBase<"parse.start"> {
  version: string;
  file: FileContext;
  routeId: string;
}

export interface ParseEndTraceRecord extends PipelineTraceBase<"parse.end"> {
  version: string;
  file: FileContext;
  routeId: string;
  rowCount: number;
  durationMs: number;
}

export interface ResolveStartTraceRecord extends PipelineTraceBase<"resolve.start"> {
  version: string;
  file: FileContext;
  routeId: string;
}

export interface ResolveEndTraceRecord extends PipelineTraceBase<"resolve.end"> {
  version: string;
  file: FileContext;
  routeId: string;
  outputCount: number;
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

export interface OutputResolvedTraceRecord extends PipelineTraceBase<"output.resolved"> {
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

export interface ErrorTraceRecord extends PipelineTraceBase<"error"> {
  error: PipelineError;
}

export type PipelineTraceRecord
  = | PipelineStartTraceRecord
    | PipelineEndTraceRecord
    | VersionStartTraceRecord
    | VersionEndTraceRecord
    | SourceProvidedTraceRecord
    | FileMatchedTraceRecord
    | FileFallbackTraceRecord
    | FileSkippedTraceRecord
    | ParseStartTraceRecord
    | ParseEndTraceRecord
    | ResolveStartTraceRecord
    | ResolveEndTraceRecord
    | CacheHitTraceRecord
    | CacheMissTraceRecord
    | CacheStoreTraceRecord
    | OutputProducedTraceRecord
    | OutputResolvedTraceRecord
    | OutputWrittenTraceRecord
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
