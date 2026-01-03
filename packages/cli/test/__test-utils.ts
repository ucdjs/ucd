import { Readable, Writable } from "node:stream";
import { vi } from "vitest";

export class ConsoleOutputCapture {
  private spies: Map<unknown, { mockRestore: () => void }> = new Map();
  public readonly captured: {
    log: string[];
    warn: string[];
    error: string[];
  } = {
    log: [],
    warn: [],
    error: [],
  };

  start(): void {
    const consoleMethods = [
      { name: "log" as const, captureKey: "log" as const },
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
      ...this.captured.warn,
      ...this.captured.error,
    ].join("\n");
  }

  getLogOutput(): string {
    return this.captured.log.join("\n");
  }

  getErrorOutput(): string {
    return this.captured.error.join("\n");
  }

  getWarnOutput(): string {
    return this.captured.warn.join("\n");
  }

  contains(text: string): boolean {
    return this.getAllOutput().includes(text);
  }

  containsError(text: string): boolean {
    return this.captured.error.some((call) => call.includes(text));
  }

  containsWarn(text: string): boolean {
    return this.captured.warn.some((call) => call.includes(text));
  }

  containsLog(text: string): boolean {
    return this.captured.log.some((call) => call.includes(text));
  }

  json<T = unknown>(): T | null {
    const log = this.getLogOutput().trim();
    if (!log) return null;
    try {
      return JSON.parse(log) as T;
    } catch {
      return null;
    }
  }

  hasValidJson(): boolean {
    return this.json() !== null;
  }

  clear(): void {
    this.captured.log = [];
    this.captured.warn = [];
    this.captured.error = [];
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
