import type { PipelineExecutionRuntime } from "../runtime";
import type {
  PipelineTraceInput,
  PipelineTraceRecord,
  PipelineTraceRecordByKind,
} from "../traces";

export interface TraceEmitter {
  emit: <TTrace extends PipelineTraceInput>(
    trace: TTrace,
  ) => Promise<PipelineTraceRecordByKind<TTrace["kind"]>>;
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

  const emit = async <TTrace extends PipelineTraceInput>(
    trace: TTrace,
  ): Promise<PipelineTraceRecordByKind<TTrace["kind"]>> => {
    const context = runtime.getExecutionContext();
    const fullTrace = {
      ...trace,
      id: nextTraceId(),
      spanId: context?.spanId,
      timestamp: Date.now(),
    } as unknown as PipelineTraceRecordByKind<TTrace["kind"]>;

    await onTrace?.(fullTrace);
    return fullTrace;
  };

  return {
    emit,
    nextTraceId,
  };
}
