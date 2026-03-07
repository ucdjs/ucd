import type { PipelineLogger } from "@ucdjs/pipelines-core";
import type {
  PipelineCaptureOptions,
  PipelineLogEntry,
  PipelineLogLevel,
  PipelineLogSource,
  PipelineLogStream,
} from "./types";
import { AsyncLocalStorage } from "node:async_hooks";
import { Buffer } from "node:buffer";
import { getPipelineExecutionContext } from "./log-context";

interface LoggerRuntimeContext {
  onLog?: (entry: PipelineLogEntry) => void | Promise<void>;
}

interface CapturedLogOptions {
  level: PipelineLogLevel;
  stream: PipelineLogStream;
  source: PipelineLogSource;
  message: string;
  args?: unknown[];
  meta?: Record<string, unknown>;
}

interface ConsoleLogInput {
  level: PipelineLogLevel;
  stream: PipelineLogStream;
  source: "console" | "stdio";
  args: unknown[];
}

type WriteFn = (chunk: unknown, encoding?: BufferEncoding, cb?: (error?: Error | null) => void) => boolean;

const runtimeStorage = new AsyncLocalStorage<LoggerRuntimeContext>();

let captureSessionCount = 0;
let consoleCaptureEnabledCount = 0;
let stdioCaptureEnabledCount = 0;
let stdioSuppressionDepth = 0;

const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

const originalStdio = {
  stdoutWrite: process.stdout.write.bind(process.stdout) as WriteFn,
  stderrWrite: process.stderr.write.bind(process.stderr) as WriteFn,
};

function formatLogArgs(args: unknown[]): string {
  if (args.length === 0) {
    return "";
  }

  return args.map((arg) => {
    if (typeof arg === "string") {
      return arg;
    }

    if (arg instanceof Error) {
      return arg.stack ?? arg.message;
    }

    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  }).join(" ");
}

function normalizeChunk(chunk: unknown, encoding?: BufferEncoding): string {
  if (typeof chunk === "string") {
    return chunk;
  }

  if (Buffer.isBuffer(chunk)) {
    return chunk.toString(encoding ?? "utf-8");
  }

  return String(chunk);
}

function dispatchLog(options: CapturedLogOptions): void {
  const runtime = runtimeStorage.getStore();
  const context = getPipelineExecutionContext();

  if (!runtime?.onLog || !context) {
    return;
  }

  void runtime.onLog({
    executionId: context.executionId,
    workspaceId: context.workspaceId,
    spanId: context.spanId,
    event: context.event,
    level: options.level,
    stream: options.stream,
    source: options.source,
    message: options.message,
    timestamp: Date.now(),
    args: options.args,
    meta: options.meta,
  });
}

function dispatchCapturedLog(input: ConsoleLogInput): void {
  dispatchLog({
    level: input.level,
    stream: input.stream,
    source: input.source,
    message: formatLogArgs(input.args),
    args: input.args,
  });
}

function wrapConsoleMethod(
  original: (...args: unknown[]) => void,
  level: PipelineLogLevel,
  stream: PipelineLogStream,
): (...args: unknown[]) => void {
  return (...args: unknown[]) => {
    if (consoleCaptureEnabledCount > 0) {
      dispatchCapturedLog({ level, stream, source: "console", args });
    }

    stdioSuppressionDepth++;
    try {
      original(...args);
    } finally {
      stdioSuppressionDepth--;
    }
  };
}

function wrapWrite(
  original: WriteFn,
  stream: PipelineLogStream,
): WriteFn {
  return (chunk, encoding, cb) => {
    if (stdioCaptureEnabledCount > 0 && stdioSuppressionDepth === 0) {
      dispatchLog({
        level: stream === "stderr" ? "error" : "info",
        stream,
        source: "stdio",
        message: normalizeChunk(chunk, encoding),
        args: [chunk],
      });
    }

    return original(chunk, encoding, cb);
  };
}

function installCaptureHooks(): void {
  console.log = wrapConsoleMethod(originalConsole.log, "info", "stdout");
  console.info = wrapConsoleMethod(originalConsole.info, "info", "stdout");
  console.warn = wrapConsoleMethod(originalConsole.warn, "warn", "stderr");
  console.error = wrapConsoleMethod(originalConsole.error, "error", "stderr");
  process.stdout.write = wrapWrite(originalStdio.stdoutWrite, "stdout");
  process.stderr.write = wrapWrite(originalStdio.stderrWrite, "stderr");
}

function uninstallCaptureHooks(): void {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  process.stdout.write = originalStdio.stdoutWrite;
  process.stderr.write = originalStdio.stderrWrite;
}

export function runWithPipelineLogHandler<T>(
  onLog: ((entry: PipelineLogEntry) => void | Promise<void>) | undefined,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return runtimeStorage.run({ onLog }, fn);
}

export function startLogCapture(options: PipelineCaptureOptions = {}): () => void {
  const captureConsole = options.console ?? false;
  const captureStdio = options.stdio ?? false;

  if (!captureConsole && !captureStdio) {
    return () => {};
  }

  if (captureSessionCount === 0) {
    installCaptureHooks();
  }

  captureSessionCount++;
  if (captureConsole) {
    consoleCaptureEnabledCount++;
  }
  if (captureStdio) {
    stdioCaptureEnabledCount++;
  }

  let stopped = false;
  return () => {
    if (stopped) {
      return;
    }

    stopped = true;
    if (captureConsole) {
      consoleCaptureEnabledCount--;
    }
    if (captureStdio) {
      stdioCaptureEnabledCount--;
    }
    captureSessionCount--;

    if (captureSessionCount === 0) {
      uninstallCaptureHooks();
    }
  };
}

export function createPipelineLogger(): PipelineLogger {
  return {
    debug: (message, meta) => {
      dispatchLog({ level: "debug", stream: "stdout", source: "logger", message, args: [message], meta });
    },
    info: (message, meta) => {
      dispatchLog({ level: "info", stream: "stdout", source: "logger", message, args: [message], meta });
    },
    warn: (message, meta) => {
      dispatchLog({ level: "warn", stream: "stderr", source: "logger", message, args: [message], meta });
    },
    error: (message, meta) => {
      dispatchLog({ level: "error", stream: "stderr", source: "logger", message, args: [message], meta });
    },
  };
}
