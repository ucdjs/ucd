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
  const emitterId = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const nextTraceId = (): string => `trace_${emitterId}_${++traceCounter}`;
  const nextSpanId = (): string => {
    const bytes = new Uint8Array(8);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  };

  const emit = async (trace: PipelineTraceInput): Promise<PipelineTraceRecord> => {
    const context = runtime.getExecutionContext();
    const runtimeFields = {
      id: nextTraceId(),
      traceId: context?.traceId ?? "",
      spanId: context?.spanId,
      parentSpanId: context?.parentSpanId,
      timestamp: Date.now(),
    };
    // The spread of a large discriminated union confuses TypeScript's ability to
    // verify the result satisfies PipelineTraceRecord, so we assert the type here.
    // The correctness is guaranteed structurally: `trace` is PipelineTraceInput
    // (which is PipelineTraceRecord minus the runtime fields), and `runtimeFields`
    // supplies exactly those missing fields.
    const fullTrace = { ...trace, ...runtimeFields } as PipelineTraceRecord;

    await onTrace?.(fullTrace);
    return fullTrace;
  };

  return {
    emit,
    nextTraceId,
    nextSpanId,
  };
}
