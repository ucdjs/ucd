import type {
  PipelineTraceInput,
  PipelineTraceRecord,
} from "../run/traces";
import type { PipelineExecutionRuntime } from "../runtime";

export interface TraceEmitter {
  emit: (trace: PipelineTraceInput) => Promise<PipelineTraceRecord>;
  nextTraceId: () => string;
}

export interface TraceHandlerOptions {
  onTrace?: (trace: PipelineTraceRecord) => void | Promise<void>;
  runtime: PipelineExecutionRuntime;
}

export function createTraceEmitter(options: TraceHandlerOptions): TraceEmitter {
  const { onTrace, runtime } = options;
  let traceCounter = 0;

  const nextTraceId = (): string => `trace_${Date.now()}_${++traceCounter}`;

  const emit = async (trace: PipelineTraceInput): Promise<PipelineTraceRecord> => {
    const context = runtime.getExecutionContext();
    const fullTrace = { ...trace, ...{
      id: nextTraceId(),
      spanId: context?.spanId,
      timestamp: Date.now(),
    } };

    await onTrace?.(fullTrace);
    return fullTrace;
  };

  return {
    emit,
    nextTraceId,
  };
}
