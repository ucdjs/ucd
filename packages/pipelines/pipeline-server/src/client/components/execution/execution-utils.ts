import type { PipelineEvent, PipelineEventPhase } from "@ucdjs/pipelines-core";
import { getPipelineEventPhase } from "@ucdjs/pipelines-core";

export interface ExecutionSpan {
  spanId: string;
  label: string;
  start: number;
  end: number;
  durationMs: number;
  phase: PipelineEventPhase;
  isError?: boolean;
}

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

function buildSpanLabel(event: PipelineEvent): string {
  if ("version" in event && event.version) {
    return `${event.type} v${event.version}`;
  }
  if ("routeId" in event && event.routeId) {
    return `${event.type} ${event.routeId}`;
  }
  if ("artifactId" in event && event.artifactId) {
    return `${event.type} ${event.artifactId}`;
  }
  if ("file" in event && event.file) {
    return `${event.type} ${event.file.name}`;
  }
  return event.type;
}

export function buildExecutionSpans(events: PipelineEvent[]): ExecutionSpan[] {
  const startMap = new Map<string, PipelineEvent>();
  const spans: ExecutionSpan[] = [];

  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  for (const event of sorted) {
    if (event.type.endsWith(":start")) {
      startMap.set(event.spanId, event);
      continue;
    }

    if (event.type.endsWith(":end")) {
      const startEvent = startMap.get(event.spanId);
      if (!startEvent) continue;

      const durationMs = "durationMs" in event && typeof event.durationMs === "number"
        ? event.durationMs
        : Math.max(0, event.timestamp - startEvent.timestamp);

      spans.push({
        spanId: event.spanId,
        label: buildSpanLabel(startEvent),
        start: startEvent.timestamp,
        end: event.timestamp,
        durationMs,
        phase: getPipelineEventPhase(startEvent.type),
      });
      startMap.delete(event.spanId);
    }

    if (event.type === "error") {
      spans.push({
        spanId: event.spanId,
        label: buildSpanLabel(event),
        start: event.timestamp,
        end: event.timestamp + 1,
        durationMs: 0,
        phase: getPipelineEventPhase(event.type),
        isError: true,
      });
    }
  }

  return spans.sort((a, b) => a.start - b.start);
}
