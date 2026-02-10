import type {
  ArtifactDefinition,
  InferRoute,
  RouteResolveContext,
} from "../src/route";
import type { FileContext, ParsedRow, PropertyJson } from "../src/types";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  definePipelineRoute,
} from "../src/route";
import { definePipelineTransform } from "../src/transform";

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

function createMockResolveContext(): RouteResolveContext {
  return {
    version: "16.0.0",
    file: createFileContext(),
    getArtifact: vi.fn(),
    emitArtifact: vi.fn(),
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
      depends: ["route:other-route", "artifact:source:data"] as const,
      parser: mockParser,
      resolver: async () => [],
    });

    expect(route.depends).toEqual(["route:other-route", "artifact:source:data"]);
  });

  it("should define a route with emits", () => {
    const emits = {
      result: {
        _type: "artifact" as const,
        schema: z.string(),
        scope: "version" as const,
      },
    };

    const route = definePipelineRoute({
      id: "emitting-route",
      filter: () => true,
      emits,
      parser: mockParser,
      resolver: async () => [],
    });

    expect(route.emits).toBe(emits);
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
      out: {
        dir: "custom-dir",
        fileName: (pj) => `${pj.property}.json`,
      },
    });

    expect(route.out?.dir).toBe("custom-dir");
    expect(typeof route.out?.fileName).toBe("function");
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

    const emits = {
      data: {
        _type: "artifact" as const,
        schema: z.number(),
        scope: "version" as const,
      },
    };

    const route = definePipelineRoute({
      id: "full-route",
      filter: (ctx) => ctx.file.ext === ".txt",
      depends: ["route:dependency"] as const,
      emits,
      parser: mockParser,
      transforms: [transform] as const,
      resolver: async () => [],
      out: { dir: "output" },
      cache: true,
    });

    expect(route.id).toBe("full-route");
    expect(route.depends).toHaveLength(1);
    expect(route.emits).toBe(emits);
    expect(route.transforms).toHaveLength(1);
    expect(route.out?.dir).toBe("output");
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

    const route = definePipelineRoute<"custom", readonly [], Record<string, never>, readonly [], CustomOutput>({
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
  it("should provide getArtifact in resolver context", async () => {
    const getArtifact = vi.fn().mockReturnValue("artifact-value");

    const route = definePipelineRoute({
      id: "test",
      filter: () => true,
      depends: ["artifact:source:data"] as const,
      parser: mockParser,
      resolver: async (ctx) => {
        const value = ctx.getArtifact("source:data");
        return [{ value }] as any;
      },
    });

    const ctx: RouteResolveContext = {
      ...createMockResolveContext(),
      getArtifact,
    };

    await route.resolver(ctx, mockParser());

    expect(getArtifact).toHaveBeenCalledWith("source:data");
  });

  it("should provide emitArtifact in resolver context", async () => {
    const emitArtifact = vi.fn();

    const route = definePipelineRoute({
      id: "test",
      filter: () => true,
      emits: {
        result: {
          _type: "artifact",
          schema: z.string(),
          scope: "version",
        },
      },
      parser: mockParser,
      resolver: async (ctx) => {
        ctx.emitArtifact("result", "emitted-value");
        return [];
      },
    });

    const ctx: RouteResolveContext = {
      ...createMockResolveContext(),
      emitArtifact,
    };

    await route.resolver(ctx, mockParser());

    expect(emitArtifact).toHaveBeenCalledWith("result", "emitted-value");
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

    const ctx: RouteResolveContext = {
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

    const ctx: RouteResolveContext = {
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
        depends: ["route:dep1", "artifact:route:artifact"] as const,
        parser: mockParser,
        resolver: async () => [],
      });

      type Depends = InferRoute<typeof route>["depends"];
      expectTypeOf<Depends>().toEqualTypeOf<readonly ["route:dep1", "artifact:route:artifact"]>();
    });

    it("should infer route emits", () => {
      const emits = {
        data: {
          _type: "artifact" as const,
          schema: z.string(),
          scope: "version" as const,
        },
      } satisfies Record<string, ArtifactDefinition>;

      const route = definePipelineRoute({
        id: "test",
        filter: () => true,
        emits,
        parser: mockParser,
        resolver: async () => [],
      });

      type Emits = InferRoute<typeof route>["emits"];
      const routeEmits: Emits = route.emits!;

      expect(routeEmits.data._type).toBe("artifact");
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
