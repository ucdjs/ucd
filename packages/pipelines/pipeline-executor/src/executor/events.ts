import type { PipelineEvent, PipelineEventInput } from "@ucdjs/pipelines-core";
import type { PipelineExecutionRuntime } from "../runtime";

export interface EventEmitter {
  emit: (event: PipelineEventInput) => Promise<void>;
  nextEventId: () => string;
  nextSpanId: () => string;
}

export interface EventHandlerOptions {
  onEvent?: (event: PipelineEvent) => void | Promise<void>;
  runtime: PipelineExecutionRuntime;
}

export function createEventEmitter(options: EventHandlerOptions): EventEmitter {
  const { onEvent, runtime } = options;

  let eventCounter = 0;
  const nextEventId = (): string => `evt_${Date.now()}_${++eventCounter}`;

  let spanCounter = 0;
  const nextSpanId = (): string => `span_${Date.now()}_${++spanCounter}`;

  const emit = async (event: PipelineEventInput): Promise<void> => {
    const fullEvent = {
      ...event,
      id: event.id ?? nextEventId(),
      spanId: event.spanId ?? nextSpanId(),
    } satisfies PipelineEvent;

    await runtime.withEvent(fullEvent, async () => {
      await onEvent?.(fullEvent);
    });
  };

  return { emit, nextEventId, nextSpanId };
}

export async function emitWithSpan(
  runtime: PipelineExecutionRuntime,
  spanId: string,
  fn: () => Promise<void>,
): Promise<void> {
  await runtime.withSpan(spanId, fn);
}
