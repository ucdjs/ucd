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

export function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms >= 1) return `${ms.toFixed(1)}ms`;
  return `${(ms * 1000).toFixed(0)}μs`;
}

export function formatTimeLabel(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const millis = String(date.getMilliseconds()).padStart(3, "0");
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${millis} ${timezone}`;
}

export function formatBytes(value: number | null): string {
  if (!value) return "0B";
  if (value < 1024) return `${value}B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)}KB`;
  return `${(value / (1024 * 1024)).toFixed(1)}MB`;
}

export function formatExecutionDuration(startedAt: string, completedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const durationMs = Math.max(0, end - start);

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  if (durationMs < 60_000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  }

  return `${Math.floor(durationMs / 60_000)}m ${Math.floor((durationMs % 60_000) / 1000)}s`;
}

export function formatStartedAt(timestamp: string): string {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function formatHighPrecisionTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const fractionalMs = ms % 1000;
  return `${seconds}.${fractionalMs.toFixed(3).padStart(6, "0")}s`;
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
