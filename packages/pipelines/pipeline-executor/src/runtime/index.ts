import type { Span } from "@opentelemetry/api";
import type { PipelineLogger } from "@ucdjs/pipelines-core";
import type {
  PipelineLogEntry,
  PipelineLogLevel,
  PipelineLogSource,
} from "../types";
import { SpanStatusCode, trace } from "@opentelemetry/api";

export interface RuntimeExecutionContext {
  executionId: string;
  workspaceId: string;
}

export interface PipelineExecutionLogInput {
  level: PipelineLogLevel | null;
  source: PipelineLogSource;
  message: string;
  timestamp?: number;
  args?: unknown[];
  meta?: Record<string, unknown>;
}

export interface PipelineExecutionRuntime {
  startSpan: <T>(name: string, fn: (span: Span) => T | Promise<T>) => T | Promise<T>;
  getExecutionContext: () => RuntimeExecutionContext | undefined;
  runWithExecutionContext: <T>(
    context: RuntimeExecutionContext,
    fn: () => T | Promise<T>,
  ) => T | Promise<T>;
  runWithLogHandler: <T>(
    onLog: ((entry: PipelineLogEntry) => void | Promise<void>) | undefined,
    fn: () => T | Promise<T>,
  ) => T | Promise<T>;
  emitLog: (entry: PipelineExecutionLogInput) => void;
  startOutputCapture?: () => () => void;
  writeOutput: (locator: string, content: string) => Promise<void>;
  resolvePath: (base: string, relative: string) => string;
}

export interface RunSpanOptions {
  recordErrors?: boolean;
}

export function runSpan<T>(
  span: Span,
  fn: (span: Span) => T | Promise<T>,
  options?: RunSpanOptions,
): T | Promise<T> {
  const recordErrors = options?.recordErrors ?? false;

  function onError(err: unknown): never {
    if (recordErrors) {
      const message = err instanceof Error ? err.message : String(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message });
      span.recordException(err instanceof Error ? err : new Error(message));
    }
    span.end();
    throw err;
  }

  let result: T | Promise<T>;
  try {
    result = fn(span);
  } catch (err) {
    onError(err);
  }

  if (result instanceof Promise) {
    return result.then(
      (val) => {
        span.end();
        return val;
      },
      onError,
    ) as T | Promise<T>;
  }

  span.end();
  return result;
}

export function createPipelineLogger(runtime: PipelineExecutionRuntime): PipelineLogger {
  return {
    debug: (message, meta) => {
      runtime.emitLog({ level: "debug", source: "logger", message, meta });
    },
    info: (message, meta) => {
      runtime.emitLog({ level: "info", source: "logger", message, meta });
    },
    warn: (message, meta) => {
      runtime.emitLog({ level: "warn", source: "logger", message, meta });
    },
    error: (message, meta) => {
      runtime.emitLog({ level: "error", source: "logger", message, meta });
    },
  };
}

// eslint-disable-next-line ts/explicit-function-return-type
function noopStop() {}

export function createNoopExecutionRuntime(): PipelineExecutionRuntime {
  return {
    startSpan: (name, fn) => trace.getTracer("pipeline-noop").startActiveSpan(name, (span) => runSpan(span, fn)),
    getExecutionContext: () => undefined,
    runWithExecutionContext: (_context, fn) => fn(),
    runWithLogHandler: (_onLog, fn) => fn(),
    emitLog: () => {},
    startOutputCapture: () => noopStop,
    writeOutput: async () => {},
    resolvePath: (_base, relative) => relative,
  };
}
