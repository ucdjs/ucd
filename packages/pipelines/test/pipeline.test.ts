import type { FileContext, ParseContext, ParsedRow, PropertyJson, ResolveContext } from "../src/types";
import { describe, expect, expectTypeOf, it } from "vitest";
import { definePipelineArtifact } from "../src/artifact";
import { byDir, byExt, byGlob, byName } from "../src/filters";
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

function createRow(ctx: ParseContext, props: Partial<ParsedRow> & { codePoint?: string; property?: string }): ParsedRow {
  return {
    sourceFile: ctx.file.path,
    kind: props.codePoint ? "point" : "range",
    ...props,
  };
}

describe("definePipeline", () => {
  it("should create a pipeline with routes", () => {
    const route = definePipelineRoute({
      id: "test-route",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        const content = await ctx.readContent();
        yield createRow(ctx, { codePoint: "0000", property: "test", value: content });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        const entries = [];
        for await (const row of rows) {
          entries.push({ codePoint: row.codePoint, value: row.value as string });
        }
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({})],
      routes: [route],
    });

    expect(pipeline).toBeDefined();
    expect(typeof pipeline.run).toBe("function");
  });

  it("should run a simple pipeline and return results", async () => {
    const route = definePipelineRoute({
      id: "simple",
      filter: byName("data.txt"),
      parser: async function* (ctx) {
        const content = await ctx.readContent();
        for (const line of content.split("\n")) {
          if (line.trim()) {
            const [codePoint, prop] = line.split(";").map((s) => s.trim());
            yield createRow(ctx, { codePoint, property: prop ?? "", value: prop ?? "" });
          }
        }
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        const entries = [];
        for await (const row of rows) {
          entries.push({ codePoint: row.codePoint, value: row.property ?? "" });
        }
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries }];
      },
    });

    const source = createMockSource({
      "16.0.0": {
        "data.txt": "0041;Letter\n0042;Letter",
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [source],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      version: "16.0.0",
      property: "Test",
    });
    expect(result.summary.totalFiles).toBe(1);
    expect(result.summary.matchedFiles).toBe(1);
    expect(result.summary.skippedFiles).toBe(0);
  });

  it("should emit events during pipeline execution", async () => {
    const events: string[] = [];

    const route = definePipelineRoute({
      id: "event-test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", property: "test", value: "test" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => [
        { version: ctx.version, property: "Test", file: ctx.file.name, entries: [] },
      ],
    });

    const source = createMockSource({
      "16.0.0": { "test.txt": "content" },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [source],
      routes: [route],
      onEvent: (event) => {
        events.push(event.type);
      },
    });

    await pipeline.run();

    expect(events).toContain("pipeline:start");
    expect(events).toContain("pipeline:end");
    expect(events).toContain("version:start");
    expect(events).toContain("version:end");
    expect(events).toContain("file:matched");
    expect(events).toContain("parse:start");
    expect(events).toContain("parse:end");
    expect(events).toContain("resolve:start");
    expect(events).toContain("resolve:end");
  });

  it("should build a pipeline graph", async () => {
    const route = definePipelineRoute({
      id: "graph-test",
      filter: byName("file.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", property: "test", value: "x" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => [
        { version: ctx.version, property: "Test", file: ctx.file.name, entries: [] },
      ],
    });

    const source = createMockSource({
      "16.0.0": { "file.txt": "content" },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [source],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.graph.nodes.length).toBeGreaterThan(0);
    expect(result.graph.edges.length).toBeGreaterThan(0);

    const nodeTypes = result.graph.nodes.map((n) => n.type);
    expect(nodeTypes).toContain("source");
    expect(nodeTypes).toContain("file");
    expect(nodeTypes).toContain("route");
    expect(nodeTypes).toContain("output");

    const edgeTypes = result.graph.edges.map((e) => e.type);
    expect(edgeTypes).toContain("provides");
    expect(edgeTypes).toContain("matched");
    expect(edgeTypes).toContain("resolved");
  });

  it("should support artifacts", async () => {
    const aliasArtifact = definePipelineArtifact({
      id: "aliases",
      build: async () => {
        return new Map([["A", ["Letter_A", "Uppercase_A"]]]);
      },
    });

    const route = definePipelineRoute({
      id: "with-artifact",
      filter: byName("data.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0041", property: "A", value: "A" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        const aliases = (ctx.getArtifact as (k: string) => Map<string, string[]> | undefined)("aliases");
        const entries = [];
        for await (const row of rows) {
          const propertyAliases = aliases?.get(row.property ?? "") ?? [];
          entries.push({
            codePoint: row.codePoint,
            value: propertyAliases.join(",") || (row.property ?? ""),
          });
        }
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries }];
      },
    });

    const source = createMockSource({
      "16.0.0": { "data.txt": "0041;A" },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [source],
      artifacts: [aliasArtifact],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(1);
  });

  it("should use fallback for unmatched files", async () => {
    const route = definePipelineRoute({
      id: "specific",
      filter: byName("known.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", property: "known", value: "known" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => [
        { version: ctx.version, property: "Known", file: ctx.file.name, entries: [] },
      ],
    });

    const source = createMockSource({
      "16.0.0": {
        "known.txt": "content",
        "unknown.txt": "other content",
      },
    });

    const fallbackRoute = {
      parser: async function* (ctx: ParseContext) {
        yield createRow(ctx, { codePoint: "FFFF", property: "fallback", value: await ctx.readContent() });
      },
      resolver: async (ctx: ResolveContext): Promise<PropertyJson[]> => [
        { version: ctx.version, property: "Fallback", file: ctx.file.name, entries: [] },
      ],
    };

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [source],
      routes: [route],
      fallback: fallbackRoute,
    });

    const result = await pipeline.run();

    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(2);
    expect(result.summary.matchedFiles).toBe(1);
    expect(result.summary.fallbackFiles).toBe(1);
  });

  it("should skip files with no match in non-strict mode", async () => {
    const route = definePipelineRoute({
      id: "strict-test",
      filter: byName("matched.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", property: "test", value: "test" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => [
        { version: ctx.version, property: "Matched", file: ctx.file.name, entries: [] },
      ],
    });

    const source = createMockSource({
      "16.0.0": {
        "matched.txt": "content",
        "unmatched.txt": "other",
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [source],
      routes: [route],
      strict: false,
    });

    const result = await pipeline.run();

    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(1);
    expect(result.summary.skippedFiles).toBe(1);
  });

  it("should report error for unmatched files in strict mode", async () => {
    const route = definePipelineRoute({
      id: "strict-test",
      filter: byName("matched.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", property: "test", value: "test" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => [
        { version: ctx.version, property: "Matched", file: ctx.file.name, entries: [] },
      ],
    });

    const source = createMockSource({
      "16.0.0": {
        "matched.txt": "content",
        "unmatched.txt": "other",
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [source],
      routes: [route],
      strict: true,
    });

    const result = await pipeline.run();

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.scope).toBe("file");
    expect(result.errors[0]!.message).toContain("No matching route");
  });

  it("should handle route errors gracefully", async () => {
    const route = definePipelineRoute({
      id: "error-route",
      filter: byName("error.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", property: "test", value: "test" });
      },
      resolver: async (): Promise<PropertyJson[]> => {
        throw new Error("Resolver failed");
      },
    });

    const source = createMockSource({
      "16.0.0": { "error.txt": "content" },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [source],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.scope).toBe("route");
    expect(result.errors[0]!.message).toBe("Resolver failed");
    expect(result.errors[0]!.routeId).toBe("error-route");
  });

  it("should process multiple versions", async () => {
    const route = definePipelineRoute({
      id: "multi-version",
      filter: byName("data.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", property: "test", value: "test" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => [
        { version: ctx.version, property: "Test", file: ctx.file.name, entries: [] },
      ],
    });

    const source = createMockSource({
      "16.0.0": { "data.txt": "content" },
      "15.1.0": { "data.txt": "content" },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0", "15.1.0"],
      inputs: [source],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.data).toHaveLength(2);
    const versions = result.data.map((d) => (d as PropertyJson).version);
    expect(versions).toContain("16.0.0");
    expect(versions).toContain("15.1.0");
    expect(result.summary.versions).toEqual(["16.0.0", "15.1.0"]);
  });

  it("should apply include filter to limit processed files", async () => {
    const route = definePipelineRoute({
      id: "include-test",
      filter: byExt(".txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", property: "test", value: "test" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => [
        { version: ctx.version, property: "Test", file: ctx.file.name, entries: [] },
      ],
    });

    const source = createMockSource({
      "16.0.0": {
        "include.txt": "content",
        "exclude.txt": "content",
        "data/nested.txt": "content",
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [source],
      routes: [route],
      include: byDir(""),
    });

    const result = await pipeline.run();

    expect(result.data).toHaveLength(2);
    const files = result.data.map((d) => (d as PropertyJson).file);
    expect(files).toContain("include.txt");
    expect(files).toContain("exclude.txt");
    expect(files).not.toContain("nested.txt");
  });
});

describe("filters", () => {
  const createFile = (path: string, version = "16.0.0"): FileContext => ({
    path,
    name: path.split("/").pop() ?? path,
    dir: path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "",
    ext: path.includes(".") ? path.substring(path.lastIndexOf(".")) : "",
    version,
  });

  describe("byName", () => {
    it("should match exact file name", () => {
      const filter = byName("test.txt");
      expect(filter({ file: createFile("test.txt") })).toBe(true);
      expect(filter({ file: createFile("other.txt") })).toBe(false);
      expect(filter({ file: createFile("dir/test.txt") })).toBe(true);
    });
  });

  describe("byDir", () => {
    it("should match files in directory", () => {
      const filter = byDir("ucd");
      expect(filter({ file: createFile("ucd/test.txt") })).toBe(true);
      expect(filter({ file: createFile("other/test.txt") })).toBe(false);
      expect(filter({ file: createFile("test.txt") })).toBe(false);
    });
  });

  describe("byExt", () => {
    it("should match files by extension", () => {
      const filter = byExt(".txt");
      expect(filter({ file: createFile("test.txt") })).toBe(true);
      expect(filter({ file: createFile("test.html") })).toBe(false);
    });
  });

  describe("byGlob", () => {
    it("should match files by glob pattern", () => {
      const filter = byGlob("**/*.txt");
      expect(filter({ file: createFile("test.txt") })).toBe(true);
      expect(filter({ file: createFile("dir/test.txt") })).toBe(true);
      expect(filter({ file: createFile("test.html") })).toBe(false);
    });

    it("should support complex glob patterns", () => {
      const filter = byGlob("auxiliary/*.txt");
      expect(filter({ file: createFile("auxiliary/WordBreakTest.txt") })).toBe(true);
      expect(filter({ file: createFile("UnicodeData.txt") })).toBe(false);
    });
  });
});

describe("type inference", () => {
  it("should infer route output types", () => {
    const route = definePipelineRoute({
      id: "typed-route",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", property: "test", value: "test" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => [
        { version: ctx.version, property: "Test", file: ctx.file.name, entries: [{ codePoint: "0000", value: "X" }] },
      ],
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({})],
      routes: [route] as const,
    });

    const _typeTest = async () => {
      const result = await pipeline.run();
      expectTypeOf(result.data).toBeArray();
    };
  });

  it("should have properly typed resolver context", () => {
    const aliasArtifact = definePipelineArtifact({
      id: "aliases",
      build: async () => new Map<string, string[]>(),
    });

    const countArtifact = definePipelineArtifact({
      id: "count",
      build: async () => 42,
    });

    const route = definePipelineRoute({
      id: "typed-artifacts",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", property: "test", value: "test" });
      },
      resolver: async (ctx, _rows): Promise<PropertyJson[]> => {
        const getArtifact = ctx.getArtifact as (k: string) => unknown;
        const aliases = getArtifact("aliases");
        const count = getArtifact("count");

        expect(aliases).toBeUndefined();
        expect(count).toBeUndefined();

        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const _pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({})],
      artifacts: [aliasArtifact, countArtifact],
      routes: [route],
    });
  });
});
