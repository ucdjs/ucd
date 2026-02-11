import type { PipelineEvent } from "@ucdjs/pipelines-core";

export interface ExecutionSpan {
  spanId: string;
  label: string;
  start: number;
  end: number;
  durationMs: number;
  phase: string;
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

function buildSpanPhase(type: string): string {
  if (type.startsWith("pipeline:")) return "Pipeline";
  if (type.startsWith("version:")) return "Version";
  if (type.startsWith("parse:")) return "Parse";
  if (type.startsWith("resolve:")) return "Resolve";
  if (type.startsWith("artifact:")) return "Artifact";
  if (type.startsWith("file:")) return "File";
  if (type.startsWith("cache:")) return "Cache";
  return "Other";
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
        phase: buildSpanPhase(startEvent.type),
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
        phase: "Error",
        isError: true,
      });
    }
  }

  return spans.sort((a, b) => a.start - b.start);
}
