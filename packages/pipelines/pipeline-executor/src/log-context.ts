import type { PipelineEvent } from "@ucdjs/pipelines-core";
import { AsyncLocalStorage } from "node:async_hooks";

export interface PipelineExecutionContext {
  executionId: string;
  workspaceId: string;
  spanId?: string;
  event?: PipelineEvent;
}

const storage = new AsyncLocalStorage<PipelineExecutionContext>();

export function getPipelineExecutionContext(): PipelineExecutionContext | undefined {
  return storage.getStore();
}

export function runWithPipelineExecutionContext<T>(
  context: PipelineExecutionContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return storage.run(context, fn);
}

export function withPipelineSpan<T>(
  spanId: string,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  const current = storage.getStore();
  if (!current) {
    return fn();
  }

  return storage.run({ ...current, spanId }, fn);
}

export function withPipelineEvent<T>(
  event: PipelineEvent,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  const current = storage.getStore();
  if (!current) {
    return fn();
  }

  return storage.run({ ...current, spanId: event.spanId, event }, fn);
}
