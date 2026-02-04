import type { ParseContext, ParsedRow, PipelineFilter } from "@ucdjs/pipelines-core";
import type {
  ArtifactBuildContext,
  InferArtifactId,
  InferArtifactsMap,
  InferArtifactValue,
  PipelineArtifactDefinition,
} from "../src/definition";
import { assert, describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  definePipelineArtifact,
  isPipelineArtifactDefinition,
} from "../src/definition";

describe("definePipelineArtifact", () => {
  it("should define a minimal artifact", () => {
    const build = vi.fn().mockResolvedValue("result");
    const artifact = definePipelineArtifact({
      id: "test-artifact",
      build,
    });

    expect(artifact).toEqual({
      id: "test-artifact",
      build,
    });
  });

  it("should define artifact with filter", () => {
    const build = vi.fn().mockResolvedValue({ count: 42 });
    const filter: PipelineFilter = (ctx) => ctx.file.name.endsWith(".txt");

    const artifact = definePipelineArtifact({
      id: "filtered-artifact",
      filter,
      build,
    });

    expect(artifact.id).toBe("filtered-artifact");
    expect(artifact.filter).toBe(filter);
    expect(artifact.build).toBe(build);
  });

  it("should define artifact with parser", async () => {
    const mockRows: ParsedRow[] = [
      { sourceFile: "test.txt", kind: "point", codePoint: "0041", value: "a" },
      { sourceFile: "test.txt", kind: "range", start: "0042", end: "0043", value: "b" },
    ];

    async function* parser(_ctx: ParseContext): AsyncIterable<ParsedRow> {
      for (const row of mockRows) {
        yield row;
      }
    }

    const build = vi.fn().mockResolvedValue([]);

    const artifact = definePipelineArtifact({
      id: "parsed-artifact",
      parser,
      build,
    });

    expect(artifact.parser).toBe(parser);
  });

  it("should define artifact with all properties", async () => {
    const filter: PipelineFilter = (ctx) => ctx.file.ext === ".txt";
    async function* parser(_ctx: ParseContext): AsyncIterable<ParsedRow> {
      yield { sourceFile: "test.txt", kind: "point", codePoint: "0041", value: "test" };
    }
    const build = vi.fn().mockResolvedValue({ data: "processed" });

    const artifact = definePipelineArtifact({
      id: "complete-artifact",
      filter,
      parser,
      build,
    });

    expect(artifact).toEqual({
      id: "complete-artifact",
      filter,
      parser,
      build,
    });
  });

  it("should preserve build function signature", async () => {
    interface CustomResult {
      version: string;
      count: number;
    }

    const build = async (ctx: ArtifactBuildContext): Promise<CustomResult> => {
      return {
        version: ctx.version,
        count: 42,
      };
    };

    const artifact = definePipelineArtifact({
      id: "typed-artifact",
      build,
    });

    const context: ArtifactBuildContext = { version: "16.0.0" };
    const result = await artifact.build(context);

    expect(result).toEqual({
      version: "16.0.0",
      count: 42,
    });
  });

  it("should work with async build processing rows", async () => {
    async function* mockParser(): AsyncIterable<ParsedRow> {
      yield { sourceFile: "test.txt", kind: "point", codePoint: "0041", value: "a" };
      yield { sourceFile: "test.txt", kind: "point", codePoint: "0042", value: "b" };
    }

    const build = async (
      ctx: ArtifactBuildContext,
      rows?: AsyncIterable<ParsedRow>,
    ): Promise<number> => {
      let count = 0;
      if (rows) {
        for await (const _row of rows) {
          count++;
        }
      }
      return count;
    };

    const artifact = definePipelineArtifact({
      id: "counting-artifact",
      parser: mockParser,
      build,
    });

    const context: ArtifactBuildContext = { version: "16.0.0" };
    const rows = mockParser();
    const result = await artifact.build(context, rows);

    expect(result).toBe(2);
  });
});

describe("isPipelineArtifactDefinition", () => {
  it("should return true for valid artifact definition", () => {
    const valid: PipelineArtifactDefinition = {
      id: "test",
      build: async () => "result",
    };

    expect(isPipelineArtifactDefinition(valid)).toBe(true);
  });

  it("should return true for artifact with all properties", () => {
    const valid: PipelineArtifactDefinition = {
      id: "test",
      filter: (ctx) => ctx.file.ext === ".txt",
      async* parser() {
        yield { sourceFile: "test.txt", kind: "point", codePoint: "0041" };
      },
      build: async () => "result",
    };

    expect(isPipelineArtifactDefinition(valid)).toBe(true);
  });

  it("should return false for null", () => {
    expect(isPipelineArtifactDefinition(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isPipelineArtifactDefinition(undefined)).toBe(false);
  });

  it("should return false for primitive types", () => {
    expect(isPipelineArtifactDefinition("string")).toBe(false);
    expect(isPipelineArtifactDefinition(123)).toBe(false);
    expect(isPipelineArtifactDefinition(true)).toBe(false);
  });

  it("should return false for empty object", () => {
    expect(isPipelineArtifactDefinition({})).toBe(false);
  });

  it("should return false for object missing id", () => {
    const invalid = {
      build: async () => "result",
    };

    expect(isPipelineArtifactDefinition(invalid)).toBe(false);
  });

  it("should return false for object missing build", () => {
    const invalid = {
      id: "test",
    };

    expect(isPipelineArtifactDefinition(invalid)).toBe(false);
  });

  it("should return false for object with non-string id", () => {
    const invalid = {
      id: 123,
      build: async () => "result",
    };

    expect(isPipelineArtifactDefinition(invalid)).toBe(false);
  });

  it("should return false for object with non-function build", () => {
    const invalid = {
      id: "test",
      build: "not a function",
    };

    expect(isPipelineArtifactDefinition(invalid)).toBe(false);
  });

  it("should return false for array", () => {
    expect(isPipelineArtifactDefinition([])).toBe(false);
    expect(isPipelineArtifactDefinition([{ id: "test", build: async () => {} }])).toBe(false);
  });

  it("should work as type guard", () => {
    const unknown: unknown = {
      id: "test",
      build: async () => "result",
    };

    assert(isPipelineArtifactDefinition(unknown));
    expect(unknown.id).toBe("test");
    expect(typeof unknown.build).toBe("function");
    expectTypeOf(unknown).toEqualTypeOf<PipelineArtifactDefinition>();
  });
});

describe("type inference", () => {
  describe("inferArtifactId", () => {
    it("should infer artifact id", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const artifact = definePipelineArtifact({
        id: "my-artifact",
        build: async () => "result",
      });

      type Id = InferArtifactId<typeof artifact>;

      expectTypeOf<Id>().toEqualTypeOf<"my-artifact">();
    });

    it("should work with const assertion", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const artifact = definePipelineArtifact({
        id: "specific-id" as const,
        build: async () => 123,
      });

      type Id = InferArtifactId<typeof artifact>;

      expectTypeOf<Id>().toEqualTypeOf<"specific-id">();
    });
  });

  describe("inferArtifactValue", () => {
    it("should infer artifact value type", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const artifact = definePipelineArtifact({
        id: "test",
        build: async (): Promise<{ count: number }> => ({ count: 42 }),
      });

      type Value = InferArtifactValue<typeof artifact>;

      expectTypeOf<Value>().toEqualTypeOf<{ count: number }>();
    });

    it("should work with primitive return types", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const stringArtifact = definePipelineArtifact({
        id: "string-artifact",
        build: async (): Promise<string> => "result",
      });

      type StringValue = InferArtifactValue<typeof stringArtifact>;

      expectTypeOf<StringValue>().toEqualTypeOf<string>();
    });
  });

  describe("inferArtifactsMap", () => {
    it("should infer map of artifact ids to values", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const artifacts = [
        definePipelineArtifact({
          id: "counts",
          build: async (): Promise<number> => 42,
        }),
        definePipelineArtifact({
          id: "names",
          build: async (): Promise<string[]> => ["a", "b"],
        }),
      ] as const;

      type ArtifactsMap = InferArtifactsMap<typeof artifacts>;

      expectTypeOf<ArtifactsMap>().toEqualTypeOf<{
        counts: number;
        names: string[];
      }>();
    });

    it("should work with complex value types", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const artifacts = [
        definePipelineArtifact({
          id: "data",
          build: async (): Promise<{ items: string[]; total: number }> => ({
            items: ["x", "y"],
            total: 2,
          }),
        }),
        definePipelineArtifact({
          id: "enabled",
          build: async (): Promise<boolean> => true,
        }),
      ] as const;

      type ArtifactsMap = InferArtifactsMap<typeof artifacts>;

      expectTypeOf<ArtifactsMap>().toEqualTypeOf<{
        data: { items: string[]; total: number };
        enabled: boolean;
      }>();
    });
  });
});

describe("build context", () => {
  it("should receive version in build context", async () => {
    const build = vi.fn(async (ctx: ArtifactBuildContext) => {
      return { processedVersion: ctx.version };
    });

    const artifact = definePipelineArtifact({
      id: "version-aware",
      build,
    });

    const context: ArtifactBuildContext = { version: "16.0.0" };
    const result = await artifact.build(context);

    expect(build).toHaveBeenCalledWith(context, undefined);
    expect(result).toEqual({ processedVersion: "16.0.0" });
  });

  it("should receive rows when parser is provided", async () => {
    const mockRows: ParsedRow[] = [
      { sourceFile: "test.txt", kind: "point", codePoint: "0041", value: "a" },
      { sourceFile: "test.txt", kind: "point", codePoint: "0042", value: "b" },
    ];

    async function* mockParser(): AsyncIterable<ParsedRow> {
      for (const row of mockRows) {
        yield row;
      }
    }

    const build = vi.fn(async (ctx: ArtifactBuildContext, rows?: AsyncIterable<ParsedRow>) => {
      const collected: ParsedRow[] = [];
      if (rows) {
        for await (const row of rows) {
          collected.push(row);
        }
      }
      return { version: ctx.version, rowCount: collected.length };
    });

    const artifact = definePipelineArtifact({
      id: "row-processor",
      parser: mockParser,
      build,
    });

    const context: ArtifactBuildContext = { version: "16.0.0" };
    const rows = mockParser();
    const result = await artifact.build(context, rows);

    expect(result).toEqual({
      version: "16.0.0",
      rowCount: 2,
    });
  });
});
