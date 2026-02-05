import type { FileContext, ParseContext, ParsedRow, PropertyJson } from "../src/types";
import type { PipelineGraph } from "../src/events";
import type { PipelineRunResult, PipelineSummary } from "../src/results";
import { describe, expect, expectTypeOf, it } from "vitest";
import { byName } from "../src/filters";
import { definePipeline } from "../src/pipeline";
import { definePipelineRoute } from "../src/route";
import { definePipelineSource } from "../src/source";

let mockSourceCounter = 0;

function createMockSource(files: Record<string, Record<string, string>>) {
  return definePipelineSource({
    id: `mock-${++mockSourceCounter}`,
    backend: {
      listFiles: async (version: string): Promise<FileContext[]> => {
        const versionFiles = files[version] ?? {};
        return Object.keys(versionFiles).map((path) => ({
          path,
          name: path.split("/").pop() ?? path,
          dir: path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "",
          ext: path.includes(".") ? path.substring(path.lastIndexOf(".")) : "",
          version,
        }));
      },
      readFile: async (file: FileContext): Promise<string> => {
        const versionFiles = files[file.version] ?? {};
        return versionFiles[file.path] ?? "";
      },
    },
  });
}

function createRow(ctx: ParseContext, props: Partial<ParsedRow>): ParsedRow {
  return {
    sourceFile: ctx.file.path,
    kind: props.codePoint ? "point" : "range",
    ...props,
  };
}

describe("PipelineSummary", () => {
  it("should have correct structure", () => {
    const summary: PipelineSummary = {
      versions: ["16.0.0", "15.1.0"],
      totalFiles: 100,
      matchedFiles: 80,
      skippedFiles: 15,
      fallbackFiles: 5,
      totalOutputs: 120,
      durationMs: 500,
    };

    expectTypeOf(summary.versions).toEqualTypeOf<string[]>();
    expectTypeOf(summary.totalFiles).toEqualTypeOf<number>();
    expectTypeOf(summary.matchedFiles).toEqualTypeOf<number>();
    expectTypeOf(summary.skippedFiles).toEqualTypeOf<number>();
    expectTypeOf(summary.fallbackFiles).toEqualTypeOf<number>();
    expectTypeOf(summary.totalOutputs).toEqualTypeOf<number>();
    expectTypeOf(summary.durationMs).toEqualTypeOf<number>();
  });

  it("should contain all processed versions", async () => {
    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0", "15.1.0", "15.0.0"],
      inputs: [createMockSource({
        "16.0.0": { "test.txt": "content" },
        "15.1.0": { "test.txt": "content" },
        "15.0.0": { "test.txt": "content" },
      })],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.summary.versions).toEqual(["16.0.0", "15.1.0", "15.0.0"]);
  });

  it("should track total files across all versions", async () => {
    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0", "15.1.0"],
      inputs: [createMockSource({
        "16.0.0": { "test.txt": "a", "other.txt": "b" },
        "15.1.0": { "test.txt": "c", "another.txt": "d", "third.txt": "e" },
      })],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.summary.totalFiles).toBe(5);
  });

  it("should track matched files", async () => {
    const route = definePipelineRoute({
      id: "test",
      filter: byName("matched.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({
        "16.0.0": {
          "matched.txt": "a",
          "unmatched1.txt": "b",
          "unmatched2.txt": "c",
        },
      })],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.summary.matchedFiles).toBe(1);
  });

  it("should track skipped files", async () => {
    const route = definePipelineRoute({
      id: "test",
      filter: byName("matched.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({
        "16.0.0": {
          "matched.txt": "a",
          "unmatched1.txt": "b",
          "unmatched2.txt": "c",
        },
      })],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.summary.skippedFiles).toBe(2);
  });

  it("should track total outputs", async () => {
    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0041", value: "A" });
        yield createRow(ctx, { codePoint: "0042", value: "B" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        const outputs: PropertyJson[] = [];
        for await (const row of rows) {
          outputs.push({
            version: ctx.version,
            property: row.value as string,
            file: ctx.file.name,
            entries: [],
          });
        }
        return outputs;
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({ "16.0.0": { "test.txt": "content" } })],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.summary.totalOutputs).toBe(2);
  });

  it("should track duration", async () => {
    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({ "16.0.0": { "test.txt": "content" } })],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.summary.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe("PipelineRunResult", () => {
  it("should have correct structure", () => {
    type TestData = { id: string };
    const result: PipelineRunResult<TestData> = {
      data: [{ id: "1" }, { id: "2" }],
      graph: { nodes: [], edges: [] },
      errors: [],
      summary: {
        versions: ["16.0.0"],
        totalFiles: 10,
        matchedFiles: 8,
        skippedFiles: 2,
        fallbackFiles: 0,
        totalOutputs: 8,
        durationMs: 100,
      },
    };

    expectTypeOf(result.data).toEqualTypeOf<TestData[]>();
    expectTypeOf(result.graph).toEqualTypeOf<PipelineGraph>();
    expectTypeOf(result.errors).toBeArray();
    expectTypeOf(result.summary).toEqualTypeOf<PipelineSummary>();
  });

  it("should contain all outputs in data array", async () => {
    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0041", value: "A" });
        yield createRow(ctx, { codePoint: "0042", value: "B" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        const outputs: PropertyJson[] = [];
        for await (const row of rows) {
          outputs.push({
            version: ctx.version,
            property: row.value as string,
            file: ctx.file.name,
            entries: [{ codePoint: row.codePoint, value: row.value as string }],
          });
        }
        return outputs;
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({ "16.0.0": { "test.txt": "content" } })],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.data).toHaveLength(2);
    expect(result.data[0]?.property).toBe("A");
    expect(result.data[1]?.property).toBe("B");
  });

  it("should contain graph structure", async () => {
    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({ "16.0.0": { "test.txt": "content" } })],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.graph).toBeDefined();
    expect(result.graph.nodes).toBeInstanceOf(Array);
    expect(result.graph.edges).toBeInstanceOf(Array);
    expect(result.graph.nodes.length).toBeGreaterThan(0);
    expect(result.graph.edges.length).toBeGreaterThan(0);
  });

  it("should contain errors when they occur", async () => {
    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (): Promise<PropertyJson[]> => {
        throw new Error("Test error");
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({ "16.0.0": { "test.txt": "content" } })],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe("Test error");
    expect(result.errors[0]?.scope).toBe("route");
  });

  it("should have empty errors array when no errors occur", async () => {
    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({ "16.0.0": { "test.txt": "content" } })],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.errors).toHaveLength(0);
  });

  it("should accumulate multiple errors", async () => {
    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (): Promise<PropertyJson[]> => {
        throw new Error("Route error");
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0", "15.1.0"],
      inputs: [createMockSource({
        "16.0.0": { "test.txt": "content" },
        "15.1.0": { "test.txt": "content" },
      })],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.errors.length).toBe(2);
  });
});

describe("Result data typing", () => {
  it("should infer output type from routes", async () => {
    const route = definePipelineRoute({
      id: "test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({ "16.0.0": { "test.txt": "content" } })],
      routes: [route],
    });

    const result = await pipeline.run();

    expectTypeOf(result.data).toEqualTypeOf<PropertyJson[]>();
  });

  it("should combine multiple route output types when using same base type", async () => {
    const route1 = definePipelineRoute({
      id: "route1",
      filter: byName("a.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "A", file: ctx.file.name, entries: [] }];
      },
    });

    const route2 = definePipelineRoute({
      id: "route2",
      filter: byName("b.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {}
        return [{ version: ctx.version, property: "B", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({
        "16.0.0": { "a.txt": "content", "b.txt": "content" },
      })],
      routes: [route1, route2],
    });

    const result = await pipeline.run();

    expectTypeOf(result.data).toEqualTypeOf<PropertyJson[]>();
    expect(result.data).toHaveLength(2);
  });
});
