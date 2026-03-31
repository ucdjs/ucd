import type { Span, Tracer } from "@opentelemetry/api";
import type { FileSystemBackend } from "@ucdjs/fs-backend";
import type { PipelineLogEntry, PipelineLogLevel } from "../types";
import type {
  PipelineExecutionLogInput,
  PipelineExecutionRuntime,
  RuntimeExecutionContext,
} from "./index";
import { AsyncLocalStorage } from "node:async_hooks";
import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { trace } from "@opentelemetry/api";
import { runSpan } from "./index";

interface LoggerRuntimeContext {
  onLog?: (entry: PipelineLogEntry) => void | Promise<void>;
}

interface ConsoleLogInput {
  level: PipelineLogLevel | null;
  source: "console" | "stdio";
  args: unknown[];
}

interface WriteFunction {
  (chunk: string | Uint8Array, callback?: (error: Error | null | undefined) => void): boolean;
  (chunk: string | Uint8Array, encoding: BufferEncoding, callback?: (error: Error | null | undefined) => void): boolean;
}

export interface NodeExecutionRuntimeOptions {
  fs?: FileSystemBackend;
  outputCapture?: {
    console?: boolean;
    stdio?: boolean;
  };
  tracer?: Tracer;
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

  readonly #appStorage = new AsyncLocalStorage<RuntimeExecutionContext>();
  readonly #logHandlerStorage = new AsyncLocalStorage<LoggerRuntimeContext>();
  readonly #fs;
  readonly #outputCapture;
  readonly #tracer: Tracer;
  #captureSessionCount = 0;
  #consoleCaptureEnabledCount = 0;
  #stdioCaptureEnabledCount = 0;

  constructor(options: NodeExecutionRuntimeOptions) {
    this.#fs = options.fs;
    this.#outputCapture = options.outputCapture ?? {};
    this.#tracer = options.tracer ?? trace.getTracer("pipeline-executor");
  }

  startSpan<T>(name: string, fn: (span: Span) => T | Promise<T>): T | Promise<T> {
    const app = this.#appStorage.getStore();
    if (!app) {
      // No execution context - use noop tracer so the callback still fires
      return trace.getTracer("pipeline-noop").startActiveSpan(name, (span) => runSpan(span, fn));
    }

    return this.#tracer.startActiveSpan(name, (span) => runSpan(span, fn, { recordErrors: true }));
  }

  getExecutionContext(): RuntimeExecutionContext | undefined {
    return this.#appStorage.getStore();
  }

  runWithExecutionContext<T>(
    context: RuntimeExecutionContext,
    fn: () => T | Promise<T>,
  ): T | Promise<T> {
    return this.#appStorage.run(context, fn);
  }

  runWithLogHandler<T>(
    onLog: ((entry: PipelineLogEntry) => void | Promise<void>) | undefined,
    fn: () => T | Promise<T>,
  ): T | Promise<T> {
    return this.#logHandlerStorage.run({ onLog }, fn);
  }

  emitLog(entry: PipelineExecutionLogInput): void {
    const logCtx = this.#logHandlerStorage.getStore();
    const appCtx = this.#appStorage.getStore();

    if (!logCtx?.onLog || !appCtx) {
      return;
    }

    const onLog = logCtx.onLog;
    const spanId = trace.getActiveSpan()?.spanContext().spanId;

    // Run onLog with no handler in context so any console.log/stdout writes
    // inside the handler are not re-captured as pipeline log entries.
    void this.#logHandlerStorage.run({ onLog: undefined }, () => onLog({
      executionId: appCtx.executionId,
      workspaceId: appCtx.workspaceId,
      spanId,
      level: entry.level,
      source: entry.source,
      message: entry.message,
      timestamp: entry.timestamp ?? Date.now(),
      args: entry.args,
      meta: entry.meta,
    }));
  }

  async writeOutput(locator: string, content: string): Promise<void> {
    if (this.#fs) {
      await this.#fs.write(locator, content);
      return;
    }

    await mkdir(path.dirname(locator), { recursive: true });
    await writeFile(locator, content, "utf8");
  }

  resolvePath(base: string, relative: string): string {
    return path.resolve(base, relative);
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
      source: input.source,
      message: NodeExecutionRuntime.#formatLogArgs(input.args),
      args: input.args,
    });
  }

  #emitCapturedWrite(
    chunk: unknown,
    encoding: BufferEncoding | undefined,
    level: PipelineLogLevel,
  ): void {
    if (this.#stdioCaptureEnabledCount === 0) {
      return;
    }

    this.emitLog({
      level,
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
    level: PipelineLogLevel,
  ): void {
    for (const runtime of NodeExecutionRuntime.#activeRuntimes) {
      runtime.#emitCapturedWrite(chunk, encoding, level);
    }
  }

  static #installCaptureHooks(): void {
    // eslint-disable-next-line no-console
    console.log = NodeExecutionRuntime.#wrapConsoleMethod(NodeExecutionRuntime.#originalConsole.log, null);
    // eslint-disable-next-line no-console
    console.info = NodeExecutionRuntime.#wrapConsoleMethod(NodeExecutionRuntime.#originalConsole.info, "info");
    console.warn = NodeExecutionRuntime.#wrapConsoleMethod(NodeExecutionRuntime.#originalConsole.warn, "warn");
    console.error = NodeExecutionRuntime.#wrapConsoleMethod(NodeExecutionRuntime.#originalConsole.error, "error");
    // eslint-disable-next-line node/prefer-global/process
    process.stdout.write = NodeExecutionRuntime.#wrapWrite(NodeExecutionRuntime.#originalStdio.stdoutWrite, "info");
    // eslint-disable-next-line node/prefer-global/process
    process.stderr.write = NodeExecutionRuntime.#wrapWrite(NodeExecutionRuntime.#originalStdio.stderrWrite, "error");
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
    level: PipelineLogLevel | null,
  ): (...args: unknown[]) => void {
    return (...args: unknown[]) => {
      NodeExecutionRuntime.#dispatchCapturedConsoleLog({ level, source: "console", args });

      NodeExecutionRuntime.#stdioSuppressionDepth++;
      try {
        original(...args);
      } finally {
        NodeExecutionRuntime.#stdioSuppressionDepth--;
      }
    };
  }

  static #wrapWrite(original: WriteFunction, level: PipelineLogLevel): WriteFunction {
    const wrapped: WriteFunction = (chunk: string | Uint8Array, encodingOrCallback?: BufferEncoding | ((error: Error | null | undefined) => void), callback?: (error: Error | null | undefined) => void): boolean => {
      const encoding = typeof encodingOrCallback === "string" ? encodingOrCallback : undefined;

      if (NodeExecutionRuntime.#stdioSuppressionDepth === 0) {
        NodeExecutionRuntime.#dispatchCapturedWrite(chunk, encoding, level);
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
