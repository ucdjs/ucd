import { formatDuration } from "#lib/execution-logs";

export const phaseOptions = [
  "Pipeline",
  "Version",
  "Parse",
  "Resolve",
  "Artifact",
  "File",
  "Cache",
  "Error",
] as const;

export type PhaseOption = typeof phaseOptions[number];

export const phaseLabels: Record<PhaseOption, string> = {
  Pipeline: "Pipeline",
  Version: "Version",
  Parse: "Parse",
  Resolve: "Resolve",
  Artifact: "Artifact",
  File: "File",
  Cache: "Cache",
  Error: "Error",
};

export function getPhaseColor(phase: string): string {
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
    default:
      return "bg-slate-400/70";
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
