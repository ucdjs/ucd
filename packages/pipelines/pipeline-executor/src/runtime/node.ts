import type { PipelineEvent } from "@ucdjs/pipelines-core";
import type { PipelineLogEntry, PipelineLogLevel, PipelineLogStream } from "../types";
import type {
  PipelineExecutionContext,
  PipelineExecutionLogInput,
  PipelineExecutionRuntime,
} from "./index";
import { AsyncLocalStorage } from "node:async_hooks";
import { Buffer } from "node:buffer";

interface LoggerRuntimeContext {
  onLog?: (entry: PipelineLogEntry) => void | Promise<void>;
}

interface ConsoleLogInput {
  level: PipelineLogLevel;
  stream: PipelineLogStream;
  source: "console" | "stdio";
  args: unknown[];
}

interface WriteFunction {
  (chunk: string | Uint8Array, callback?: (error: Error | null | undefined) => void): boolean;
  (chunk: string | Uint8Array, encoding: BufferEncoding, callback?: (error: Error | null | undefined) => void): boolean;
}

export interface NodeExecutionRuntimeOptions {
  outputCapture?: {
    console?: boolean;
    stdio?: boolean;
  };
}

class NodeExecutionRuntime implements PipelineExecutionRuntime {
  static readonly #activeRuntimes = new Set<NodeExecutionRuntime>();
  static #globalCaptureSessionCount = 0;
  static #stdioSuppressionDepth = 0;
  static readonly #originalConsole = {
    // eslint-disable-next-line no-console
    log: console.log,
    // eslint-disable-next-line no-console
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  static readonly #originalStdio: { stdoutWrite: WriteFunction; stderrWrite: WriteFunction } = {
    // eslint-disable-next-line node/prefer-global/process
    stdoutWrite: process.stdout.write.bind(process.stdout),
    // eslint-disable-next-line node/prefer-global/process
    stderrWrite: process.stderr.write.bind(process.stderr),
  };

  readonly #contextStorage = new AsyncLocalStorage<PipelineExecutionContext>();
  readonly #logHandlerStorage = new AsyncLocalStorage<LoggerRuntimeContext>();
  readonly #outputCapture;
  #captureSessionCount = 0;
  #consoleCaptureEnabledCount = 0;
  #stdioCaptureEnabledCount = 0;

  constructor(options: NodeExecutionRuntimeOptions) {
    this.#outputCapture = options.outputCapture ?? {};
  }

  getExecutionContext(): PipelineExecutionContext | undefined {
    return this.#contextStorage.getStore();
  }

  runWithExecutionContext<T>(
    context: PipelineExecutionContext,
    fn: () => T | Promise<T>,
  ): T | Promise<T> {
    return this.#contextStorage.run(context, fn);
  }

  withSpan<T>(spanId: string, fn: () => T | Promise<T>): T | Promise<T> {
    const current = this.#contextStorage.getStore();
    if (!current) {
      return fn();
    }

    return this.#contextStorage.run({ ...current, spanId }, fn);
  }

  withEvent<T>(event: PipelineEvent, fn: () => T | Promise<T>): T | Promise<T> {
    const current = this.#contextStorage.getStore();
    if (!current) {
      return fn();
    }

    return this.#contextStorage.run({ ...current, spanId: event.spanId, event }, fn);
  }

  runWithLogHandler<T>(
    onLog: ((entry: PipelineLogEntry) => void | Promise<void>) | undefined,
    fn: () => T | Promise<T>,
  ): T | Promise<T> {
    return this.#logHandlerStorage.run({ onLog }, fn);
  }

  emitLog(entry: PipelineExecutionLogInput): void {
    const runtime = this.#logHandlerStorage.getStore();
    const context = this.#contextStorage.getStore();

    if (!runtime?.onLog || !context) {
      return;
    }

    const onLog = runtime.onLog;

    // Run onLog with no handler in context so any console.log/stdout writes
    // inside the handler are not re-captured as pipeline log entries.
    void this.#logHandlerStorage.run({ onLog: undefined }, () => onLog({
      executionId: context.executionId,
      workspaceId: context.workspaceId,
      spanId: context.spanId,
      event: context.event,
      level: entry.level,
      stream: entry.stream,
      source: entry.source,
      message: entry.message,
      timestamp: entry.timestamp ?? Date.now(),
      args: entry.args,
      meta: entry.meta,
    }));
  }

  startOutputCapture(): () => void {
    const captureConsole = this.#outputCapture.console ?? false;
    const captureStdio = this.#outputCapture.stdio ?? false;

    if (!captureConsole && !captureStdio) {
      return () => {};
    }

    if (NodeExecutionRuntime.#globalCaptureSessionCount === 0) {
      NodeExecutionRuntime.#installCaptureHooks();
    }

    NodeExecutionRuntime.#globalCaptureSessionCount++;
    this.#captureSessionCount++;
    if (captureConsole) {
      this.#consoleCaptureEnabledCount++;
    }
    if (captureStdio) {
      this.#stdioCaptureEnabledCount++;
    }
    NodeExecutionRuntime.#activeRuntimes.add(this);

    let stopped = false;
    return () => {
      if (stopped) {
        return;
      }

      stopped = true;
      this.#captureSessionCount--;
      if (captureConsole) {
        this.#consoleCaptureEnabledCount--;
      }
      if (captureStdio) {
        this.#stdioCaptureEnabledCount--;
      }
      if (this.#captureSessionCount === 0) {
        NodeExecutionRuntime.#activeRuntimes.delete(this);
      }

      NodeExecutionRuntime.#globalCaptureSessionCount--;
      if (NodeExecutionRuntime.#globalCaptureSessionCount === 0) {
        NodeExecutionRuntime.#uninstallCaptureHooks();
      }
    };
  }

  #emitCapturedConsoleLog(input: ConsoleLogInput): void {
    if (this.#consoleCaptureEnabledCount === 0) {
      return;
    }

    this.emitLog({
      level: input.level,
      stream: input.stream,
      source: input.source,
      message: NodeExecutionRuntime.#formatLogArgs(input.args),
      args: input.args,
    });
  }

  #emitCapturedWrite(
    chunk: unknown,
    encoding: BufferEncoding | undefined,
    stream: PipelineLogStream,
  ): void {
    if (this.#stdioCaptureEnabledCount === 0) {
      return;
    }

    this.emitLog({
      level: stream === "stderr" ? "error" : "info",
      stream,
      source: "stdio",
      message: NodeExecutionRuntime.#normalizeChunk(chunk, encoding),
      args: [chunk],
    });
  }

  static #dispatchCapturedConsoleLog(input: ConsoleLogInput): void {
    for (const runtime of NodeExecutionRuntime.#activeRuntimes) {
      runtime.#emitCapturedConsoleLog(input);
    }
  }

  static #dispatchCapturedWrite(
    chunk: unknown,
    encoding: BufferEncoding | undefined,
    stream: PipelineLogStream,
  ): void {
    for (const runtime of NodeExecutionRuntime.#activeRuntimes) {
      runtime.#emitCapturedWrite(chunk, encoding, stream);
    }
  }

  static #installCaptureHooks(): void {
    // eslint-disable-next-line no-console
    console.log = NodeExecutionRuntime.#wrapConsoleMethod(NodeExecutionRuntime.#originalConsole.log, "info", "stdout");
    // eslint-disable-next-line no-console
    console.info = NodeExecutionRuntime.#wrapConsoleMethod(NodeExecutionRuntime.#originalConsole.info, "info", "stdout");
    console.warn = NodeExecutionRuntime.#wrapConsoleMethod(NodeExecutionRuntime.#originalConsole.warn, "warn", "stderr");
    console.error = NodeExecutionRuntime.#wrapConsoleMethod(NodeExecutionRuntime.#originalConsole.error, "error", "stderr");
    // eslint-disable-next-line node/prefer-global/process
    process.stdout.write = NodeExecutionRuntime.#wrapWrite(NodeExecutionRuntime.#originalStdio.stdoutWrite, "stdout");
    // eslint-disable-next-line node/prefer-global/process
    process.stderr.write = NodeExecutionRuntime.#wrapWrite(NodeExecutionRuntime.#originalStdio.stderrWrite, "stderr");
  }

  static #uninstallCaptureHooks(): void {
    // eslint-disable-next-line no-console
    console.log = NodeExecutionRuntime.#originalConsole.log;
    // eslint-disable-next-line no-console
    console.info = NodeExecutionRuntime.#originalConsole.info;
    console.warn = NodeExecutionRuntime.#originalConsole.warn;
    console.error = NodeExecutionRuntime.#originalConsole.error;
    // eslint-disable-next-line node/prefer-global/process
    process.stdout.write = NodeExecutionRuntime.#originalStdio.stdoutWrite;
    // eslint-disable-next-line node/prefer-global/process
    process.stderr.write = NodeExecutionRuntime.#originalStdio.stderrWrite;
  }

  static #wrapConsoleMethod(
    original: (...args: unknown[]) => void,
    level: PipelineLogLevel,
    stream: PipelineLogStream,
  ): (...args: unknown[]) => void {
    return (...args: unknown[]) => {
      NodeExecutionRuntime.#dispatchCapturedConsoleLog({ level, stream, source: "console", args });

      NodeExecutionRuntime.#stdioSuppressionDepth++;
      try {
        original(...args);
      } finally {
        NodeExecutionRuntime.#stdioSuppressionDepth--;
      }
    };
  }

  static #wrapWrite(original: WriteFunction, stream: PipelineLogStream): WriteFunction {
    const wrapped: WriteFunction = (chunk: string | Uint8Array, encodingOrCallback?: BufferEncoding | ((error: Error | null | undefined) => void), callback?: (error: Error | null | undefined) => void): boolean => {
      const encoding = typeof encodingOrCallback === "string" ? encodingOrCallback : undefined;

      if (NodeExecutionRuntime.#stdioSuppressionDepth === 0) {
        NodeExecutionRuntime.#dispatchCapturedWrite(chunk, encoding, stream);
      }

      if (typeof encodingOrCallback === "function") {
        return original(chunk, encodingOrCallback);
      }

      if (encodingOrCallback != null) {
        return original(chunk, encodingOrCallback, callback);
      }

      return original(chunk, callback);
    };
    return wrapped;
  }

  static #formatLogArgs(args: unknown[]): string {
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

  static #normalizeChunk(chunk: unknown, encoding?: BufferEncoding): string {
    if (typeof chunk === "string") {
      return chunk;
    }

    if (Buffer.isBuffer(chunk)) {
      return chunk.toString(encoding ?? "utf-8");
    }

    return String(chunk);
  }
}

export function createNodeExecutionRuntime(options: NodeExecutionRuntimeOptions = {}): PipelineExecutionRuntime {
  return new NodeExecutionRuntime(options);
}
