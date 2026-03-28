import type { ExecutionTraceItem } from "#shared/schemas/execution";
import type { PipelineTracePhase } from "@ucdjs/pipelines-core/tracing";
import { getTracePhase } from "@ucdjs/pipelines-core/tracing";

export interface ExecutionSpan {
  spanId: string;
  parentSpanId?: string;
  depth: number;
  label: string;
  start: number;
  end: number;
  durationMs: number;
  phase: PipelineTracePhase;
  isError?: boolean;
}

function buildSpanLabel(trace: ExecutionTraceItem): string {
  const data = trace.data as Record<string, unknown> | null;
  const fileName = data && "file" in data && data.file && typeof data.file === "object"
    ? (data.file as Record<string, unknown>).name as string | undefined
    : undefined;
  const routeId = data && "routeId" in data ? data.routeId as string | undefined : undefined;
  const version = data && "version" in data ? data.version as string | undefined : undefined;

  // For file.route the routeId + file IS the identity — no kind prefix needed.
  if (trace.kind === "file.route") {
    if (routeId && fileName) return `${routeId}: ${fileName}`;
    if (routeId) return routeId;
    if (fileName) return fileName;
  }
  // For parse/resolve keep the kind so they're distinguishable from file.route and each other.
  if (trace.kind === "parse" || trace.kind === "resolve") {
    if (routeId && fileName) return `${trace.kind} · ${routeId}: ${fileName}`;
    if (routeId) return `${trace.kind} · ${routeId}`;
    if (fileName) return `${trace.kind} · ${fileName}`;
  }

  if (version) return `${trace.kind} v${version}`;
  if (routeId) return `${trace.kind} ${routeId}`;
  if (fileName) return `${trace.kind} ${fileName}`;
  return trace.kind;
}

function computeDepths(spans: Omit<ExecutionSpan, "depth">[]): ExecutionSpan[] {
  const spanMap = new Map(spans.map(s => [s.spanId, s]));
  const depthCache = new Map<string, number>();

  function getDepth(spanId: string): number {
    if (depthCache.has(spanId)) return depthCache.get(spanId)!;
    const span = spanMap.get(spanId);
    if (!span?.parentSpanId) {
      depthCache.set(spanId, 0);
      return 0;
    }
    const depth = getDepth(span.parentSpanId) + 1;
    depthCache.set(spanId, depth);
    return depth;
  }

  return spans.map(s => ({ ...s, depth: getDepth(s.spanId) }));
}

export function buildExecutionSpans(traces: ExecutionTraceItem[]): ExecutionSpan[] {
  const raw: Omit<ExecutionSpan, "depth">[] = [];

  for (const trace of traces) {
    const data = trace.data as Record<string, unknown> | null;
    const startTimestamp = data && typeof data.startTimestamp === "number" ? data.startTimestamp : null;

    if (startTimestamp != null) {
      const endTimestamp = new Date(trace.timestamp).getTime();
      const durationMs = data && typeof data.durationMs === "number"
        ? data.durationMs
        : Math.max(0, endTimestamp - startTimestamp);

      raw.push({
        spanId: trace.spanId ?? trace.id,
        parentSpanId: trace.parentSpanId ?? undefined,
        label: buildSpanLabel(trace),
        start: startTimestamp,
        end: endTimestamp,
        durationMs,
        phase: getTracePhase(trace.kind),
      });
      continue;
    }

    if (trace.kind === "error") {
      const ts = new Date(trace.timestamp).getTime();
      raw.push({
        spanId: trace.spanId ?? trace.id,
        parentSpanId: trace.parentSpanId ?? undefined,
        label: buildSpanLabel(trace),
        start: ts,
        end: ts + 1,
        durationMs: 0,
        phase: getTracePhase(trace.kind),
        isError: true,
      });
    }
  }

  return computeDepths(raw);
}
