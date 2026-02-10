import type { FileContext, SourceBackend } from "../src";
import { vi } from "vitest";

export function createMockBackend(files: FileContext[]): SourceBackend {
  return {
    listFiles: vi.fn().mockResolvedValue(files),
    readFile: vi.fn().mockResolvedValue("file content"),
  };
}

export function createFile(overrides: Partial<FileContext> = {}): FileContext {
  return {
    version: "16.0.0",
    dir: "ucd",
    path: "ucd/LineBreak.txt",
    name: "LineBreak.txt",
    ext: ".txt",
    ...overrides,
  };
}
