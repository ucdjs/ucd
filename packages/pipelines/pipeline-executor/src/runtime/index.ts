import type { Span } from "@opentelemetry/api";
import type {
  PipelineLogEntry,
  PipelineLogLevel,
  PipelineLogSource,
} from "../types";
import { trace } from "@opentelemetry/api";

export interface PipelineExecutionContext {
  executionId: string;
  workspaceId: string;
}

export interface PipelineExecutionLogInput {
  level: PipelineLogLevel;
  source: PipelineLogSource;
  message: string;
  timestamp?: number;
  args?: unknown[];
  meta?: Record<string, unknown>;
}

export interface PipelineExecutionRuntime {
  startSpan: <T>(name: string, fn: (span: Span) => T | Promise<T>) => T | Promise<T>;
  getExecutionContext: () => PipelineExecutionContext | undefined;
  runWithExecutionContext: <T>(
    context: PipelineExecutionContext,
    fn: () => T | Promise<T>,
  ) => T | Promise<T>;
  runWithLogHandler: <T>(
    onLog: ((entry: PipelineLogEntry) => void | Promise<void>) | undefined,
    fn: () => T | Promise<T>,
  ) => T | Promise<T>;
  emitLog: (entry: PipelineExecutionLogInput) => void;
  startOutputCapture?: () => () => void;
  writeOutput?: (locator: string, content: string) => Promise<void>;
  resolvePath?: (base: string, relative: string) => string;
}

// eslint-disable-next-line ts/explicit-function-return-type
function noopStop() {}

export function createNoopExecutionRuntime(): PipelineExecutionRuntime {
  return {
    startSpan: (name, fn) => trace.getTracer("pipeline-noop").startActiveSpan(name, (span) => {
      let result: ReturnType<typeof fn>;
      try {
        result = fn(span);
      } catch (err) {
        span.end();
        throw err;
      }
      if (result instanceof Promise) {
        return result.then(
          (val) => { span.end(); return val; },
          (err) => { span.end(); throw err; },
        ) as ReturnType<typeof fn>;
      }
      span.end();
      return result;
    }),
    getExecutionContext: () => undefined,
    runWithExecutionContext: (_context, fn) => fn(),
    runWithLogHandler: (_onLog, fn) => fn(),
    emitLog: () => {},
    startOutputCapture: () => noopStop,
  };
}
