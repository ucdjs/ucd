import type {
  InferRoute,
  ResolveContext,
} from "../src/route";
import type { FileContext, ParsedRow, PipelineLogger, PropertyJson } from "../src/types";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  definePipelineRoute,
} from "../src/route";
import { definePipelineTransform } from "../src/transform";

const noopLogger: PipelineLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

function createFileContext(): FileContext {
  return {
    version: "16.0.0",
    dir: "ucd",
    path: "ucd/LineBreak.txt",
    name: "LineBreak.txt",
    ext: ".txt",
  };
}

async function* mockParser(): AsyncIterable<ParsedRow> {
  yield { sourceFile: "test.txt", kind: "point", codePoint: "0041", value: "A" };
  yield { sourceFile: "test.txt", kind: "point", codePoint: "0042", value: "B" };
}

function createMockResolveContext(): ResolveContext {
  return {
    version: "16.0.0",
    file: createFileContext(),
    logger: noopLogger,
    getRouteData: vi.fn(() => []),
    normalizeEntries: vi.fn((entries) => entries),
    now: vi.fn(() => "2024-01-01T00:00:00Z"),
  };
}

describe("definePipelineRoute", () => {
  it("should define a minimal route", () => {
    const route = definePipelineRoute({
      id: "test-route",
      filter: () => true,
      parser: mockParser,
      resolver: async () => [],
    });

    expect(route.id).toBe("test-route");
    expect(typeof route.filter).toBe("function");
    expect(typeof route.parser).toBe("function");
    expect(typeof route.resolver).toBe("function");
  });

  it("should define a route with dependencies", () => {
    const route = definePipelineRoute({
      id: "dependent-route",
      filter: () => true,
      depends: ["route:other-route"] as const,
      parser: mockParser,
      resolver: async () => [],
    });

    expect(route.depends).toEqual(["route:other-route"]);
  });

  it("should define a route with transforms", () => {
    const transform = definePipelineTransform<ParsedRow, ParsedRow>({
      id: "test-transform",
      async* fn(_ctx, rows) {
        for await (const row of rows) {
          yield row;
        }
      },
    });

    const route = definePipelineRoute({
      id: "transformed-route",
      filter: () => true,
      parser: mockParser,
      transforms: [transform] as const,
      resolver: async () => [],
    });

    expect(route.transforms).toHaveLength(1);
  });

  it("should define a route with output configuration", () => {
    const route = definePipelineRoute({
      id: "output-route",
      filter: () => true,
      parser: mockParser,
      resolver: async () => [],
      outputs: [{
        path: "custom-dir/{property:kebab}.json",
      }],
    });

    expect(route.outputs?.[0]?.path).toBe("custom-dir/{property:kebab}.json");
  });

  it("should define a route with cache option", () => {
    const route = definePipelineRoute({
      id: "cached-route",
      filter: () => true,
      parser: mockParser,
      resolver: async () => [],
      cache: true,
    });

    expect(route.cache).toBe(true);
  });

  it("should define a route with all options", () => {
    const transform = definePipelineTransform<ParsedRow, ParsedRow>({
      id: "transform",
      async* fn(_ctx, rows) {
        yield* rows;
      },
    });

    const route = definePipelineRoute({
      id: "full-route",
      filter: (ctx) => ctx.file.ext === ".txt",
      depends: ["route:dependency"] as const,
      parser: mockParser,
      transforms: [transform] as const,
      resolver: async () => [],
      outputs: [{ path: "output/{property:kebab}.json" }],
      cache: true,
    });

    expect(route.id).toBe("full-route");
    expect(route.depends).toHaveLength(1);
    expect(route.transforms).toHaveLength(1);
    expect(route.outputs?.[0]?.path).toBe("output/{property:kebab}.json");
    expect(route.cache).toBe(true);
  });
});

describe("route filter", () => {
  it("should filter by file extension", () => {
    const route = definePipelineRoute({
      id: "txt-only",
      filter: (ctx) => ctx.file.ext === ".txt",
      parser: mockParser,
      resolver: async () => [],
    });

    expect(route.filter({ file: { ...createFileContext(), ext: ".txt" } })).toBe(true);
    expect(route.filter({ file: { ...createFileContext(), ext: ".xml" } })).toBe(false);
  });

  it("should filter by file name", () => {
    const route = definePipelineRoute({
      id: "specific-file",
      filter: (ctx) => ctx.file.name === "LineBreak.txt",
      parser: mockParser,
      resolver: async () => [],
    });

    expect(route.filter({ file: createFileContext() })).toBe(true);
    expect(route.filter({ file: { ...createFileContext(), name: "Other.txt" } })).toBe(false);
  });

  it("should filter by directory", () => {
    const route = definePipelineRoute({
      id: "ucd-only",
      filter: (ctx) => ctx.file.dir === "ucd",
      parser: mockParser,
      resolver: async () => [],
    });

    expect(route.filter({ file: { ...createFileContext(), dir: "ucd" } })).toBe(true);
    expect(route.filter({ file: { ...createFileContext(), dir: "emoji" } })).toBe(false);
  });
});

describe("route resolver", () => {
  it("should call resolver with context and rows", async () => {
    const resolver = vi.fn().mockResolvedValue([]);

    const route = definePipelineRoute({
      id: "test",
      filter: () => true,
      parser: mockParser,
      resolver,
    });

    const ctx = createMockResolveContext();
    const rows = mockParser();

    await route.resolver(ctx, rows);

    expect(resolver).toHaveBeenCalledWith(ctx, rows);
  });

  it("should return PropertyJson array", async () => {
    const expectedOutput: PropertyJson[] = [{
      version: "16.0.0",
      property: "Test",
      file: "test.txt",
      entries: [],
    }];

    const route = definePipelineRoute({
      id: "test",
      filter: () => true,
      parser: mockParser,
      resolver: async () => expectedOutput,
    });

    const result = await route.resolver(createMockResolveContext(), mockParser());

    expect(result).toEqual(expectedOutput);
  });

  it("should support custom output types", async () => {
    interface CustomOutput {
      count: number;
      data: string[];
    }

    const route = definePipelineRoute<"custom", readonly [], readonly [], CustomOutput>({
      id: "custom",
      filter: () => true,
      parser: mockParser,
      resolver: async (_ctx, rows) => {
        const data: string[] = [];
        for await (const row of rows) {
          if (row.value && typeof row.value === "string") {
            data.push(row.value);
          }
        }
        return { count: data.length, data };
      },
    });

    const result = await route.resolver(createMockResolveContext(), mockParser());

    expect(result.count).toBe(2);
    expect(result.data).toEqual(["A", "B"]);
  });
});

describe("route context methods", () => {
  it("should provide getRouteData in resolver context", async () => {
    const getRouteData = vi.fn().mockReturnValue([{ data: "test" }]);

    const route = definePipelineRoute({
      id: "test",
      filter: () => true,
      depends: ["route:source"] as const,
      parser: mockParser,
      resolver: async (ctx) => {
        const data = ctx.getRouteData("source");
        return [{ data }] as any;
      },
    });

    const ctx: ResolveContext = {
      ...createMockResolveContext(),
      getRouteData,
    };

    await route.resolver(ctx, mockParser());

    expect(getRouteData).toHaveBeenCalledWith("source");
  });

  it("should provide normalizeEntries in resolver context", async () => {
    const normalizeEntries = vi.fn((entries) => entries.sort());

    const route = definePipelineRoute({
      id: "test",
      filter: () => true,
      parser: mockParser,
      resolver: async (ctx) => {
        const entries = [{ codePoint: "0042", value: "B" }, { codePoint: "0041", value: "A" }];
        ctx.normalizeEntries(entries);
        return [];
      },
    });

    const ctx: ResolveContext = {
      ...createMockResolveContext(),
      normalizeEntries,
    };

    await route.resolver(ctx, mockParser());

    expect(normalizeEntries).toHaveBeenCalled();
  });

  it("should provide now in resolver context", async () => {
    const now = vi.fn().mockReturnValue("2024-06-15T12:00:00Z");

    const route = definePipelineRoute({
      id: "test",
      filter: () => true,
      parser: mockParser,
      resolver: async (ctx) => {
        const timestamp = ctx.now();
        return [{ timestamp }] as any;
      },
    });

    const ctx: ResolveContext = {
      ...createMockResolveContext(),
      now,
    };

    const result = await route.resolver(ctx, mockParser());

    expect(now).toHaveBeenCalled();
    expect(result[0].timestamp).toBe("2024-06-15T12:00:00Z");
  });
});

describe("type inference", () => {
  describe("inferRoute", () => {
    it("should infer route id", () => {
      const routeId = "my-route" as const;
      // eslint-disable-next-line unused-imports/no-unused-vars
      const route = definePipelineRoute({
        id: routeId,
        filter: () => true,
        parser: mockParser,
        resolver: async () => [],
      });

      type RouteId = InferRoute<typeof route>["id"];
      expectTypeOf<RouteId>().toBeString();
      expectTypeOf<RouteId>().toEqualTypeOf<typeof routeId>();
    });

    it("should infer route dependencies", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const route = definePipelineRoute({
        id: "test",
        filter: () => true,
        depends: ["route:dep1"] as const,
        parser: mockParser,
        resolver: async () => [],
      });

      type Depends = InferRoute<typeof route>["depends"];
      expectTypeOf<Depends>().toEqualTypeOf<readonly ["route:dep1"]>();
    });

    it("should infer route output type", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const route = definePipelineRoute({
        id: "test",
        filter: () => true,
        parser: mockParser,
        resolver: async (): Promise<PropertyJson[]> => [],
      });

      type Output = InferRoute<typeof route>["output"];
      expectTypeOf<Output>().toEqualTypeOf<PropertyJson[]>();
    });
  });
});
