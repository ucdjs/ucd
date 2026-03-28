import type { ExecutionTraceItem } from "#shared/schemas/execution";
import type { PipelineTracePhase } from "@ucdjs/pipelines-core/tracing";
import { getTracePhase } from "@ucdjs/pipelines-core/tracing";

export interface ExecutionSpan {
  spanId: string;
  label: string;
  start: number;
  end: number;
  durationMs: number;
  phase: PipelineTracePhase;
  isError?: boolean;
}

function buildSpanLabel(trace: ExecutionTraceItem): string {
  const data = trace.data as Record<string, unknown> | null;
  if (data && "version" in data && data.version) {
    return `${trace.kind} v${data.version}`;
  }
  if (data && "routeId" in data && data.routeId) {
    return `${trace.kind} ${data.routeId}`;
  }
  if (data && "file" in data && data.file && typeof data.file === "object" && "name" in (data.file as Record<string, unknown>)) {
    return `${trace.kind} ${(data.file as Record<string, unknown>).name}`;
  }
  return trace.kind;
}

export function buildExecutionSpans(traces: ExecutionTraceItem[]): ExecutionSpan[] {
  const startMap = new Map<string, ExecutionTraceItem>();
  const spans: ExecutionSpan[] = [];

  const sorted = traces.toSorted((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  for (const trace of sorted) {
    if (trace.kind.endsWith(".start")) {
      startMap.set(trace.spanId ?? trace.id, trace);
      continue;
    }

    if (trace.kind.endsWith(".end")) {
      const key = trace.spanId ?? trace.id;
      const startTrace = startMap.get(key);
      if (!startTrace) continue;

      const startTime = new Date(startTrace.timestamp).getTime();
      const endTime = new Date(trace.timestamp).getTime();
      const data = trace.data as Record<string, unknown> | null;
      const durationMs = data && "durationMs" in data && typeof data.durationMs === "number"
        ? data.durationMs
        : Math.max(0, endTime - startTime);

      spans.push({
        spanId: key,
        label: buildSpanLabel(startTrace),
        start: startTime,
        end: endTime,
        durationMs,
        phase: getTracePhase(startTrace.kind),
      });
      startMap.delete(key);
    }

    if (trace.kind === "error") {
      const ts = new Date(trace.timestamp).getTime();
      spans.push({
        spanId: trace.spanId ?? trace.id,
        label: buildSpanLabel(trace),
        start: ts,
        end: ts + 1,
        durationMs: 0,
        phase: getTracePhase(trace.kind),
        isError: true,
      });
    }
  }

  return spans.sort((a, b) => a.start - b.start);
}
