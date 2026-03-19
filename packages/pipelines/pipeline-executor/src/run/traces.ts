import type { FileContext } from "@ucdjs/pipelines-core";

export type PipelineTraceKind
  = | "source.provided"
    | "file.matched"
    | "file.fallback"
    | "artifact.emitted"
    | "artifact.consumed"
    | "cache.hit"
    | "cache.miss"
    | "cache.store"
    | "output.produced"
    | "output.resolved"
    | "output.written";

interface PipelineTraceBase<TKind extends PipelineTraceKind> {
  id: string;
  kind: TKind;
  pipelineId: string;
  spanId?: string;
  timestamp: number;
}

export interface SourceProvidedTraceRecord extends PipelineTraceBase<"source.provided"> {
  version: string;
  file?: FileContext;
  artifactId?: string;
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

export interface ArtifactTraceRecord extends PipelineTraceBase<"artifact.emitted" | "artifact.consumed"> {
  version: string;
  routeId: string;
  artifactId: string;
}

export interface CacheTraceRecord extends PipelineTraceBase<"cache.hit" | "cache.miss" | "cache.store"> {
  version: string;
  routeId: string;
  file: FileContext;
}

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

export type PipelineTraceRecord
  = | SourceProvidedTraceRecord
    | FileMatchedTraceRecord
    | FileFallbackTraceRecord
    | ArtifactTraceRecord
    | CacheTraceRecord
    | OutputProducedTraceRecord
    | OutputResolvedTraceRecord
    | OutputWrittenTraceRecord;

export type PipelineTraceRecordByKind<TKind extends PipelineTraceKind>
  = Extract<PipelineTraceRecord, { kind: TKind }>;

export type PipelineTraceInput<TKind extends PipelineTraceKind = PipelineTraceKind>
  = Omit<PipelineTraceRecordByKind<TKind>, "id" | "timestamp" | "spanId">;

export type PipelineTraceEmitInput<TKind extends PipelineTraceKind = PipelineTraceKind>
  = Omit<PipelineTraceRecordByKind<TKind>, "id" | "timestamp" | "spanId" | "pipelineId">;

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

export function buildOutputManifestFromTraces(
  traces: readonly PipelineTraceRecord[],
): PipelineOutputManifestEntry[] {
  const manifest = new Map<string, PipelineOutputManifestEntry>();

  for (const trace of traces) {
    if (trace.kind === "output.resolved") {
      const key = getOutputManifestKey(trace.routeId, trace.outputIndex, trace.outputId, trace.locator);
      manifest.set(key, {
        outputIndex: trace.outputIndex,
        outputId: trace.outputId,
        routeId: trace.routeId,
        pipelineId: trace.pipelineId,
        version: trace.version,
        property: trace.property,
        sink: trace.sink,
        format: trace.format,
        locator: trace.locator,
        status: "resolved",
      });
      continue;
    }

    if (trace.kind === "output.written") {
      const key = getOutputManifestKey(trace.routeId, trace.outputIndex, trace.outputId, trace.locator);
      const entry = manifest.get(key);
      if (entry) {
        manifest.set(key, {
          ...entry,
          status: trace.status,
          error: trace.error,
        });
      }
    }
  }

  return [...manifest.values()].toSorted((left, right) => {
    return left.outputIndex - right.outputIndex
      || left.routeId.localeCompare(right.routeId)
      || left.outputId.localeCompare(right.outputId)
      || left.locator.localeCompare(right.locator);
  });
}

function getOutputManifestKey(
  routeId: string,
  outputIndex: number,
  outputId: string,
  locator: string,
): string {
  return `${routeId}:${outputIndex}:${outputId}:${locator}`;
}
