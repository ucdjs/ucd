import type {
  FileContext,
  ParseContext,
  ParsedRow,
  PipelineFilter,
  PipelineRouteDefinition,
  PipelineSourceDefinition,
  SourceBackend,
} from "@ucdjs/pipelines-core";
import { definePipelineRoute, definePipelineSource } from "@ucdjs/pipelines-core";
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

export function createMockBackend(files: FileContext[], contents: Record<string, string> = {}): SourceBackend {
  return {
    listFiles: vi.fn().mockResolvedValue(files),
    readFile: vi.fn().mockImplementation((file: FileContext) => {
      return Promise.resolve(contents[file.path] ?? "");
    }),
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
  artifact?: { version: string };
}

export function createTestRoute(
  id: string,
  filter: PipelineFilter,
): PipelineRouteDefinition<string, readonly [], Record<string, never>, readonly [], TestOutput> {
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
      let artifactValue: { version: string } | undefined;
      try {
        artifactValue = ctx.getArtifact("version-info" as never) as { version: string };
      } catch {
        artifactValue = undefined;
      }
      return {
        version: ctx.version,
        file: ctx.file.name,
        entries,
        artifact: artifactValue,
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
