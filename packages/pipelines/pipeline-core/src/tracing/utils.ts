import type { PipelineOutputManifestEntry, PipelineTraceKind, PipelineTraceRecord } from "./types";

export function buildOutputManifestFromTraces(
  traces: readonly PipelineTraceRecord[],
): PipelineOutputManifestEntry[] {
  const manifest = new Map<string, PipelineOutputManifestEntry>();

  for (const trace of traces) {
    if (trace.kind === "output") {
      const key = getOutputManifestKey(trace.pipelineId, trace.version, trace.routeId, trace.outputIndex, trace.outputId, trace.locator);
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
      const key = getOutputManifestKey(trace.pipelineId, trace.version, trace.routeId, trace.outputIndex, trace.outputId, trace.locator);
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
    return left.pipelineId.localeCompare(right.pipelineId)
      || left.version.localeCompare(right.version)
      || left.outputIndex - right.outputIndex
      || left.routeId.localeCompare(right.routeId)
      || left.outputId.localeCompare(right.outputId)
      || left.locator.localeCompare(right.locator);
  });
}

function getOutputManifestKey(
  pipelineId: string,
  version: string,
  routeId: string,
  outputIndex: number,
  outputId: string,
  locator: string,
): string {
  return `${pipelineId}:${version}:${routeId}:${outputIndex}:${outputId}:${locator}`;
}

export const PIPELINE_TRACE_PHASES = [
  "Pipeline",
  "Version",
  "Parse",
  "Resolve",
  "File",
  "Cache",
  "Error",
  "Other",
] as const;

export type PipelineTracePhase = typeof PIPELINE_TRACE_PHASES[number];

export function getTracePhase(kind: PipelineTraceKind): PipelineTracePhase {
  if (kind === "error") return "Error";
  if (kind === "pipeline") return "Pipeline";
  if (kind === "version") return "Version";
  if (kind === "parse") return "Parse";
  if (kind === "resolve") return "Resolve";
  if (kind === "source.listing" || kind.startsWith("file.") || kind.startsWith("source.")) return "File";
  if (kind.startsWith("cache.")) return "Cache";
  if (kind.startsWith("output.")) return "Other";
  return "Other";
}
