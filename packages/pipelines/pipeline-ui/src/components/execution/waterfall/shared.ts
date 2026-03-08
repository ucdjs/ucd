import type { PipelineEventPhase } from "@ucdjs/pipelines-core";
import { formatDuration } from "#lib/execution-logs";
import {
  PIPELINE_EVENT_PHASES,
} from "@ucdjs/pipelines-core";

export const phaseOptions = PIPELINE_EVENT_PHASES;

export const timelineColumns = 100;

export type PhaseOption = PipelineEventPhase;

export const phaseLabels: Record<PhaseOption, string> = {
  Pipeline: "Pipeline",
  Version: "Version",
  Parse: "Parse",
  Resolve: "Resolve",
  Artifact: "Artifact",
  File: "File",
  Cache: "Cache",
  Error: "Error",
  Other: "Other",
};

export function getPhaseColor(phase: PipelineEventPhase): string {
  switch (phase) {
    case "Pipeline":
      return "bg-sky-400/70";
    case "Version":
      return "bg-emerald-400/70";
    case "Parse":
      return "bg-amber-400/70";
    case "Resolve":
      return "bg-violet-400/70";
    case "Artifact":
      return "bg-rose-400/70";
    case "File":
      return "bg-cyan-400/70";
    case "Cache":
      return "bg-lime-400/70";
    case "Error":
      return "bg-red-500/80";
    case "Other":
      return "bg-slate-400/70";
    default:
      return "bg-slate-400/70";
  }
}

export function getPhaseAccentClass(phase: PipelineEventPhase): string {
  switch (phase) {
    case "Pipeline":
      return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "Version":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "Parse":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "Resolve":
      return "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300";
    case "Artifact":
      return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
    case "File":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300";
    case "Cache":
      return "border-lime-500/30 bg-lime-500/10 text-lime-700 dark:text-lime-300";
    case "Error":
      return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
    case "Other":
      return "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300";
    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300";
  }
}

export function getPhaseBarStyle(phase: PipelineEventPhase): { background: string } {
  switch (phase) {
    case "Pipeline":
      return { background: "linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%)" };
    case "Version":
      return { background: "linear-gradient(90deg, #34d399 0%, #10b981 100%)" };
    case "Parse":
      return { background: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)" };
    case "Resolve":
      return { background: "linear-gradient(90deg, #a78bfa 0%, #8b5cf6 100%)" };
    case "Artifact":
      return { background: "linear-gradient(90deg, #fb7185 0%, #f43f5e 100%)" };
    case "File":
      return { background: "linear-gradient(90deg, #22d3ee 0%, #06b6d4 100%)" };
    case "Cache":
      return { background: "linear-gradient(90deg, #a3e635 0%, #84cc16 100%)" };
    case "Error":
      return { background: "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)" };
    case "Other":
      return { background: "linear-gradient(90deg, #94a3b8 0%, #64748b 100%)" };
    default:
      return { background: "linear-gradient(90deg, #94a3b8 0%, #64748b 100%)" };
  }
}

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
