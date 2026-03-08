import type { PipelineEvent } from "@ucdjs/pipelines-core";
import type {
  PipelineLogEntry,
  PipelineLogLevel,
  PipelineLogSource,
  PipelineLogStream,
} from "../types";

export interface PipelineExecutionContext {
  executionId: string;
  workspaceId: string;
  spanId?: string;
  event?: PipelineEvent;
}

export interface PipelineExecutionLogInput {
  level: PipelineLogLevel;
  stream: PipelineLogStream;
  source: PipelineLogSource;
  message: string;
  timestamp?: number;
  args?: unknown[];
  meta?: Record<string, unknown>;
}

export interface PipelineExecutionRuntime {
  getExecutionContext: () => PipelineExecutionContext | undefined;
  runWithExecutionContext: <T>(
    context: PipelineExecutionContext,
    fn: () => T | Promise<T>,
  ) => T | Promise<T>;
  withSpan: <T>(spanId: string, fn: () => T | Promise<T>) => T | Promise<T>;
  withEvent: <T>(event: PipelineEvent, fn: () => T | Promise<T>) => T | Promise<T>;
  runWithLogHandler: <T>(
    onLog: ((entry: PipelineLogEntry) => void | Promise<void>) | undefined,
    fn: () => T | Promise<T>,
  ) => T | Promise<T>;
  emitLog: (entry: PipelineExecutionLogInput) => void;
  startOutputCapture?: () => () => void;
}

// eslint-disable-next-line ts/explicit-function-return-type
function noopStop() {}

export function createNoopExecutionRuntime(): PipelineExecutionRuntime {
  return {
    getExecutionContext: () => undefined,
    runWithExecutionContext: (_context, fn) => fn(),
    withSpan: (_spanId, fn) => fn(),
    withEvent: (_event, fn) => fn(),
    runWithLogHandler: (_onLog, fn) => fn(),
    emitLog: () => {},
    startOutputCapture: () => noopStop,
  };
}
