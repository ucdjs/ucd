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
