import type { FileContext, ParseContext, ParsedRow, PropertyJson } from "../src/types";
import { describe, expect, expectTypeOf, it } from "vitest";
import { byName } from "../src/filters";
import { definePipeline } from "../src/pipeline";
import {
  definePipelineRoute,
  type InferRouteId,
  type InferRouteOutput,
  type InferRoutesOutput,
  type PipelineRouteDefinition,
} from "../src/route";
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

describe("definePipelineRoute", () => {
  it("should create a route definition with required fields", () => {
    const route = definePipelineRoute({
      id: "test-route",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => [
        { version: ctx.version, property: "Test", file: ctx.file.name, entries: [] },
      ],
    });

    expect(route.id).toBe("test-route");
    expect(typeof route.filter).toBe("function");
    expect(typeof route.parser).toBe("function");
    expect(typeof route.resolver).toBe("function");
  });

  it("should preserve the route id as a literal type", () => {
    const route = definePipelineRoute({
      id: "line-break-route",
      filter: byName("LineBreak.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => [
        { version: ctx.version, property: "Line_Break", file: ctx.file.name, entries: [] },
      ],
    });

    expectTypeOf(route.id).toEqualTypeOf<"line-break-route">();
  });

  it("should support optional out configuration", () => {
    const route = definePipelineRoute({
      id: "with-output-config",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => [
        { version: ctx.version, property: "Test", file: ctx.file.name, entries: [] },
      ],
      out: {
        dir: "custom-output",
        fileName: (pj) => `${pj.property.toLowerCase()}.json`,
      },
    });

    expect(route.out).toBeDefined();
    expect(route.out?.dir).toBe("custom-output");
    expect(typeof route.out?.fileName).toBe("function");
  });

  it("should parse file content correctly", async () => {
    const parsedRows: ParsedRow[] = [];

    const route = definePipelineRoute({
      id: "parsing-test",
      filter: byName("data.txt"),
      parser: async function* (ctx) {
        for await (const line of ctx.readLines()) {
          if (!ctx.isComment(line) && line.trim()) {
            const [codePoint, value] = line.split(";").map((s) => s.trim());
            yield createRow(ctx, { codePoint, value });
          }
        }
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const row of rows) {
          parsedRows.push(row);
        }
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({
        "16.0.0": { "data.txt": "# comment\n0041;A\n0042;B\n\n0043;C" },
      })],
      routes: [route],
    });

    await pipeline.run();

    expect(parsedRows).toHaveLength(3);
    expect(parsedRows[0]!.codePoint).toBe("0041");
    expect(parsedRows[1]!.codePoint).toBe("0042");
    expect(parsedRows[2]!.codePoint).toBe("0043");
  });

  it("should receive file context in parser", async () => {
    let receivedFile: FileContext | undefined;

    const route = definePipelineRoute({
      id: "file-context-test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        receivedFile = ctx.file;
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        // Must consume rows to trigger parser execution
        for await (const _row of rows) {
          // consume
        }
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({ "16.0.0": { "test.txt": "content" } })],
      routes: [route],
    });

    await pipeline.run();

    expect(receivedFile).toBeDefined();
    expect(receivedFile?.name).toBe("test.txt");
    expect(receivedFile?.version).toBe("16.0.0");
  });

  it("should receive version and file in resolver context", async () => {
    let receivedVersion: string | undefined;
    let receivedFileName: string | undefined;

    const route = definePipelineRoute({
      id: "resolver-context-test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => {
        receivedVersion = ctx.version;
        receivedFileName = ctx.file.name;
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({ "16.0.0": { "test.txt": "content" } })],
      routes: [route],
    });

    await pipeline.run();

    expect(receivedVersion).toBe("16.0.0");
    expect(receivedFileName).toBe("test.txt");
  });

  it("should provide normalizeEntries utility in resolver", async () => {
    let hasNormalizeEntries = false;

    const route = definePipelineRoute({
      id: "normalize-test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => {
        hasNormalizeEntries = typeof ctx.normalizeEntries === "function";
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({ "16.0.0": { "test.txt": "content" } })],
      routes: [route],
    });

    await pipeline.run();

    expect(hasNormalizeEntries).toBe(true);
  });

  it("should provide now utility for timestamps", async () => {
    let timestamp: string | undefined;

    const route = definePipelineRoute({
      id: "timestamp-test",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => {
        timestamp = ctx.now();
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({ "16.0.0": { "test.txt": "content" } })],
      routes: [route],
    });

    await pipeline.run();

    expect(timestamp).toBeDefined();
    expect(new Date(timestamp!).toISOString()).toBe(timestamp);
  });

  it("should match files based on filter", async () => {
    const matchedFiles: string[] = [];

    const route = definePipelineRoute({
      id: "filter-test",
      filter: byName("target.txt"),
      parser: async function* (ctx) {
        matchedFiles.push(ctx.file.name);
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {
          // consume to trigger parser
        }
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({
        "16.0.0": {
          "target.txt": "content",
          "other.txt": "content",
          "another.txt": "content",
        },
      })],
      routes: [route],
    });

    await pipeline.run();

    expect(matchedFiles).toEqual(["target.txt"]);
  });

  it("should support returning single output instead of array", async () => {
    const route = definePipelineRoute({
      id: "single-output",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => [
        { version: ctx.version, property: "Test", file: ctx.file.name, entries: [] },
      ],
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({ "16.0.0": { "test.txt": "content" } })],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.data).toHaveLength(1);
  });

  it("should support returning multiple outputs from resolver", async () => {
    const route = definePipelineRoute({
      id: "multi-output",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0041", property: "A", value: "A" });
        yield createRow(ctx, { codePoint: "0042", property: "B", value: "B" });
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        const outputs: PropertyJson[] = [];
        for await (const row of rows) {
          outputs.push({
            version: ctx.version,
            property: row.property ?? "Unknown",
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
  });

  it("should handle parser errors", async () => {
    const route = definePipelineRoute({
      id: "parser-error",
      filter: byName("test.txt"),
      parser: async function* () {
        throw new Error("Parser failed");
      },
      resolver: async (ctx, rows): Promise<PropertyJson[]> => {
        for await (const _row of rows) {
          // consume to trigger parser error
        }
        return [{ version: ctx.version, property: "Test", file: ctx.file.name, entries: [] }];
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({ "16.0.0": { "test.txt": "content" } })],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.message).toBe("Parser failed");
  });

  it("should handle resolver errors", async () => {
    const route = definePipelineRoute({
      id: "resolver-error",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (): Promise<PropertyJson[]> => {
        throw new Error("Resolver failed");
      },
    });

    const pipeline = definePipeline({
      versions: ["16.0.0"],
      inputs: [createMockSource({ "16.0.0": { "test.txt": "content" } })],
      routes: [route],
    });

    const result = await pipeline.run();

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.message).toBe("Resolver failed");
    expect(result.errors[0]!.routeId).toBe("resolver-error");
  });
});

describe("route type inference", () => {
  it("should infer route id type", () => {
    const route = definePipelineRoute({
      id: "inferred-id",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => [
        { version: ctx.version, property: "Test", file: ctx.file.name, entries: [] },
      ],
    });

    type Id = InferRouteId<typeof route>;
    expectTypeOf<Id>().toEqualTypeOf<"inferred-id">();
  });

  it("should infer route output type", () => {
    const route = definePipelineRoute({
      id: "typed-output",
      filter: byName("test.txt"),
      parser: async function* (ctx) {
        yield createRow(ctx, { codePoint: "0000", value: "x" });
      },
      resolver: async (ctx): Promise<PropertyJson[]> => [
        { version: ctx.version, property: "Test", file: ctx.file.name, entries: [] },
      ],
    });

    type Output = InferRouteOutput<typeof route>;
    expectTypeOf<Output>().toEqualTypeOf<PropertyJson[]>();
  });

  it("should infer combined output from multiple routes", () => {
    type Routes = readonly [
      PipelineRouteDefinition<"a", Record<string, unknown>, PropertyJson[]>,
      PipelineRouteDefinition<"b", Record<string, unknown>, PropertyJson[]>,
    ];

    type Output = InferRoutesOutput<Routes>;
    expectTypeOf<Output>().toEqualTypeOf<PropertyJson>();
  });

  it("should type PipelineRouteDefinition with generics", () => {
    type CustomRoute = PipelineRouteDefinition<"custom-id", { cache: Map<string, number> }, PropertyJson[]>;

    expectTypeOf<CustomRoute["id"]>().toEqualTypeOf<"custom-id">();
  });
});
