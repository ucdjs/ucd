import type {
  PipelineTraceInput,
  PipelineTraceRecord,
} from "@ucdjs/pipelines-core/tracing";
import type { PipelineExecutionRuntime } from "../runtime";

export interface TraceEmitter {
  emit: (trace: PipelineTraceInput) => Promise<PipelineTraceRecord>;
  nextTraceId: () => string;
  nextSpanId: () => string;
}

export interface TraceHandlerOptions {
  onTrace?: (trace: PipelineTraceRecord) => void | Promise<void>;
  runtime: PipelineExecutionRuntime;
}

export function createTraceEmitter(options: TraceHandlerOptions): TraceEmitter {
  const { onTrace, runtime } = options;
  let traceCounter = 0;
  let spanCounter = 0;
  const emitterId = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const nextTraceId = (): string => `trace_${emitterId}_${++traceCounter}`;
  const nextSpanId = (): string => `span_${emitterId}_${++spanCounter}`;

  const emit = async (trace: PipelineTraceInput): Promise<PipelineTraceRecord> => {
    const context = runtime.getExecutionContext();
    const fullTrace = { ...trace, ...{
      id: nextTraceId(),
      traceId: context?.traceId ?? "",
      spanId: context?.spanId,
      parentSpanId: context?.parentSpanId,
      timestamp: Date.now(),
    } } satisfies PipelineTraceRecord;

    await onTrace?.(fullTrace);
    return fullTrace;
  };

  return {
    emit,
    nextTraceId,
    nextSpanId,
  };
}
