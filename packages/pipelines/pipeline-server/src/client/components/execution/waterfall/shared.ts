import type { PipelineTracePhase } from "@ucdjs/pipelines-core";
import { formatDuration } from "#lib/format";

export const timelineColumns = 100;

export const phaseLabels: Record<PipelineTracePhase, string> = {
  Pipeline: "Pipeline",
  Version: "Version",
  Parse: "Parse",
  Resolve: "Resolve",
  File: "File",
  Cache: "Cache",
  Error: "Error",
  Other: "Other",
};

export function formatTickLabel(valueMs: number): string {
  if (valueMs <= 0) return "0ms";
  if (valueMs < 1) return "<1ms";
  return formatDuration(valueMs);
}

export function buildTicks(durationMs: number, count = 5): number[] {
  if (durationMs <= 0) return [0];
  if (count < 2) return [0, durationMs];
  const step = durationMs / (count - 1);
  return Array.from({ length: count }, (_, index) => index * step);
}

export function getTimelineTickColumn(tick: number, durationMs: number): number {
  if (durationMs <= 0) return 1;
  const ratio = Math.min(Math.max(tick / durationMs, 0), 1);
  return Math.min(timelineColumns, Math.floor(ratio * (timelineColumns - 1)) + 1);
}

export function getTimelineGridRange(startMs: number, endMs: number, durationMs: number) {
  if (durationMs <= 0) {
    return { startColumn: 1, endColumn: 3 };
  }

  const startRatio = Math.min(Math.max(startMs / durationMs, 0), 1);
  const endRatio = Math.min(Math.max(endMs / durationMs, 0), 1);
  const startColumn = Math.min(
    timelineColumns,
    Math.floor(startRatio * (timelineColumns - 1)) + 1,
  );
  const endColumn = Math.max(
    startColumn + 1,
    Math.min(timelineColumns + 1, Math.ceil(endRatio * timelineColumns) + 1),
  );

  return { startColumn, endColumn };
}
