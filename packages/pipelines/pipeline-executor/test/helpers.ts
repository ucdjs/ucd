import type { FileSystemBackend } from "@ucdjs/fs-backend";
import type {
  FileContext,
  ParseContext,
  ParsedRow,
  PipelineFilter,
  PipelineRouteDefinition,
  PipelineSourceDefinition,
} from "@ucdjs/pipeline-core";
import { definePipelineRoute, definePipelineSource } from "@ucdjs/pipeline-core";
import { vi } from "vitest";

export function createMockFile(name: string, dir: string = "ucd"): FileContext {
  return {
    version: "16.0.0",
    dir,
    path: `${dir}/${name}`,
    name,
    ext: name.includes(".") ? `.${name.split(".").pop()}` : "",
  };
}

export function createMockBackend(files: FileContext[], contents: Record<string, string> = {}): FileSystemBackend {
  const entries = files.map((f) => ({
    type: "file" as const,
    name: f.name,
    path: f.path,
  }));

  return {
    meta: { name: "mock" },
    features: new Set(),
    hook: () => () => {},
    list: vi.fn().mockResolvedValue(entries),
    read: vi.fn().mockImplementation((path: string) => {
      // The executor prefixes with version (e.g., "16.0.0/ucd/LineBreak.txt"),
      // but contents are keyed by relative path (e.g., "ucd/LineBreak.txt")
      const parts = path.split("/");
      const withoutVersion = parts.length > 1 ? parts.slice(1).join("/") : path;
      return Promise.resolve(contents[withoutVersion] ?? contents[path] ?? "");
    }),
    readBytes: vi.fn().mockResolvedValue(new Uint8Array()),
    exists: vi.fn().mockResolvedValue(true),
    stat: vi.fn().mockResolvedValue({ type: "file", size: 0 }),
    write: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    copy: vi.fn().mockResolvedValue(undefined),
  };
}

export async function* mockParser(ctx: ParseContext): AsyncIterable<ParsedRow> {
  const content = await ctx.readContent();
  const lines = content.split("\n").filter((line) => !ctx.isComment(line));

  for (const line of lines) {
    const [codePoint, value] = line.split(";").map((s) => s.trim());
    if (codePoint && value) {
      yield {
        sourceFile: ctx.file.path,
        kind: "point",
        codePoint,
        value,
      };
    }
  }
}

export interface TestOutput {
  version: string;
  file: string;
  entries: Array<{ codePoint: string; value: string }>;
}

export function createTestRoute(
  id: string,
  filter: PipelineFilter,
): PipelineRouteDefinition<string, readonly [], readonly [], TestOutput> {
  return definePipelineRoute({
    id,
    filter,
    parser: mockParser,
    resolver: async (ctx, rows) => {
      const entries: Array<{ codePoint: string; value: string }> = [];
      for await (const row of rows) {
        entries.push({
          codePoint: row.codePoint!,
          value: row.value as string,
        });
      }
      return {
        version: ctx.version,
        file: ctx.file.name,
        entries,
      };
    },
  });
}

export function createTestSource(files: FileContext[], contents: Record<string, string> = {}): PipelineSourceDefinition {
  return definePipelineSource({
    id: "test-source",
    backend: createMockBackend(files, contents),
  });
}
