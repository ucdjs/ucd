import { Readable, Writable } from "node:stream";
import { vi } from "vitest";

export class ConsoleOutputCapture {
  private spies: Map<unknown, { mockRestore: () => void }> = new Map();
  public readonly captured: {
    log: string[];
    info: string[];
    warn: string[];
    error: string[];
    stdout: string[];
  } = {
    log: [],
    info: [],
    warn: [],
    error: [],
    stdout: [],
  };

  start(): void {
    const consoleMethods = [
      { name: "log" as const, captureKey: "log" as const },
      { name: "info" as const, captureKey: "info" as const },
      { name: "warn" as const, captureKey: "warn" as const },
      { name: "error" as const, captureKey: "error" as const },
    ];

    for (const { name, captureKey } of consoleMethods) {
      const original = (console as any)[name].bind(console);
      this.spies.set(name, vi.spyOn(console, name).mockImplementation((...args: unknown[]) => {
        const output = args.join(" ");
        this.captured[captureKey].push(output);
        original(...args);
      }));
    }

    this.spies.set("stdout", vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
      const output = typeof chunk === "string" ? chunk : String(chunk);
      this.captured.stdout.push(output);
      // Don't redirect to console.log - just capture it silently
      // This prevents the circular issue with JSON mode where console.log -> console.error
      return true;
    }));
  }

  restore(): void {
    for (const spy of this.spies.values()) {
      spy.mockRestore();
    }
    this.spies.clear();
  }

  getAllOutput(): string {
    return [
      ...this.captured.log,
      ...this.captured.info,
      ...this.captured.warn,
      ...this.captured.error,
      ...this.captured.stdout,
    ].join("\n");
  }

  getInfoOutput(): string {
    return this.captured.info.join("\n");
  }

  getErrorOutput(): string {
    return this.captured.error.join("\n");
  }

  getWarnOutput(): string {
    return this.captured.warn.join("\n");
  }

  getStdoutOutput(): string {
    return this.captured.stdout.join("");
  }

  contains(text: string): boolean {
    return this.getAllOutput().includes(text);
  }

  containsInfo(text: string): boolean {
    return this.captured.info.some((call) => call.includes(text));
  }

  containsError(text: string): boolean {
    return this.captured.error.some((call) => call.includes(text));
  }

  containsWarn(text: string): boolean {
    return this.captured.warn.some((call) => call.includes(text));
  }

  containsStdout(text: string): boolean {
    return this.captured.stdout.some((call) => call.includes(text));
  }

  json<T = unknown>(): T | null {
    const stdout = this.getStdoutOutput().trim();
    if (!stdout) return null;
    try {
      return JSON.parse(stdout) as T;
    } catch {
      return null;
    }
  }

  hasValidJson(): boolean {
    return this.json() !== null;
  }

  clear(): void {
    this.captured.log = [];
    this.captured.info = [];
    this.captured.warn = [];
    this.captured.error = [];
    this.captured.stdout = [];
  }
}

export function captureConsoleOutput(): ConsoleOutputCapture {
  const capture = new ConsoleOutputCapture();
  capture.start();
  return capture;
}

export class MockWritable extends Writable {
  public buffer: string[] = [];
  public isTTY = false;

  _write(
    chunk: any,
    _encoding: BufferEncoding,
    callback: (error?: Error | null | undefined) => void,
  ): void {
    this.buffer.push(chunk.toString());
    callback();
  }
}

export class MockReadable extends Readable {
  protected _buffer: unknown[] | null = [];

  _read() {
    if (this._buffer === null) {
      this.push(null);
      return;
    }

    for (const val of this._buffer) {
      this.push(val);
    }

    this._buffer = [];
  }

  pushValue(val: unknown): void {
    this._buffer?.push(val);
  }

  close(): void {
    this._buffer = null;
  }
}
