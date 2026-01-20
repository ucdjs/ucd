import type { FallbackRouteDefinition } from "../src/pipeline";
import type { SourceBackend } from "../src/source";
import type { ParsedRow } from "../src/types";
import { describe, expect, it, vi } from "vitest";
import {
  definePipeline,
  getPipelineRouteIds,
  getPipelineSourceIds,
  isPipelineDefinition,
} from "../src/pipeline";
import { definePipelineRoute } from "../src/route";
import { definePipelineSource } from "../src/source";

function createMockBackend(): SourceBackend {
  return {
    listFiles: vi.fn().mockResolvedValue([]),
    readFile: vi.fn().mockResolvedValue(""),
  };
}

function createMockSource(id: string) {
  return definePipelineSource({
    id,
    backend: createMockBackend(),
  });
}

async function* mockParser(): AsyncIterable<ParsedRow> {
  yield { sourceFile: "test.txt", kind: "point", codePoint: "0041", value: "A" };
}

function createMockRoute(id: string) {
  return definePipelineRoute({
    id,
    filter: () => true,
    parser: mockParser,
    resolver: async () => [],
  });
}

describe("definePipeline", () => {
  it("should define a minimal pipeline", () => {
    const pipeline = definePipeline({
      id: "test-pipeline",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
    });

    expect(pipeline._type).toBe("pipeline-definition");
    expect(pipeline.id).toBe("test-pipeline");
    expect(pipeline.versions).toEqual(["16.0.0"]);
    expect(pipeline.inputs).toEqual([]);
    expect(pipeline.routes).toEqual([]);
  });

  it("should define a pipeline with name and description", () => {
    const pipeline = definePipeline({
      id: "named-pipeline",
      name: "My Pipeline",
      description: "A test pipeline",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
    });

    expect(pipeline.name).toBe("My Pipeline");
    expect(pipeline.description).toBe("A test pipeline");
  });

  it("should define a pipeline with multiple versions", () => {
    const pipeline = definePipeline({
      id: "multi-version",
      versions: ["16.0.0", "15.1.0", "15.0.0"],
      inputs: [],
      routes: [],
    });

    expect(pipeline.versions).toEqual(["16.0.0", "15.1.0", "15.0.0"]);
  });

  it("should define a pipeline with inputs", () => {
    const source1 = createMockSource("source1");
    const source2 = createMockSource("source2");

    const pipeline = definePipeline({
      id: "with-inputs",
      versions: ["16.0.0"],
      inputs: [source1, source2],
      routes: [],
    });

    expect(pipeline.inputs).toHaveLength(2);
    expect(pipeline.inputs[0].id).toBe("source1");
    expect(pipeline.inputs[1].id).toBe("source2");
  });

  it("should define a pipeline with routes", () => {
    const route1 = createMockRoute("route1");
    const route2 = createMockRoute("route2");

    const pipeline = definePipeline({
      id: "with-routes",
      versions: ["16.0.0"],
      inputs: [],
      routes: [route1, route2],
    });

    expect(pipeline.routes).toHaveLength(2);
    expect(pipeline.routes[0].id).toBe("route1");
    expect(pipeline.routes[1].id).toBe("route2");
  });

  it("should define a pipeline with include filter", () => {
    const include = vi.fn().mockReturnValue(true);

    const pipeline = definePipeline({
      id: "filtered",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
      include,
    });

    expect(pipeline.include).toBe(include);
  });

  it("should default strict to false", () => {
    const pipeline = definePipeline({
      id: "default-strict",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
    });

    expect(pipeline.strict).toBe(false);
  });

  it("should allow setting strict to true", () => {
    const pipeline = definePipeline({
      id: "strict-pipeline",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
      strict: true,
    });

    expect(pipeline.strict).toBe(true);
  });

  it("should default concurrency to 4", () => {
    const pipeline = definePipeline({
      id: "default-concurrency",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
    });

    expect(pipeline.concurrency).toBe(4);
  });

  it("should allow setting custom concurrency", () => {
    const pipeline = definePipeline({
      id: "custom-concurrency",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
      concurrency: 8,
    });

    expect(pipeline.concurrency).toBe(8);
  });

  it("should define a pipeline with fallback", () => {
    const fallback: FallbackRouteDefinition = {
      parser: mockParser,
      resolver: async () => [],
    };

    const pipeline = definePipeline({
      id: "with-fallback",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
      fallback,
    });

    expect(pipeline.fallback).toBe(fallback);
  });

  it("should define a pipeline with fallback filter", () => {
    const fallback: FallbackRouteDefinition = {
      filter: (ctx) => ctx.file.ext === ".txt",
      parser: mockParser,
      resolver: async () => [],
    };

    const pipeline = definePipeline({
      id: "filtered-fallback",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
      fallback,
    });

    expect(pipeline.fallback?.filter).toBeDefined();
  });

  it("should define a pipeline with onEvent handler", () => {
    const onEvent = vi.fn();

    const pipeline = definePipeline({
      id: "with-events",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
      onEvent,
    });

    expect(pipeline.onEvent).toBe(onEvent);
  });

  it("should define a complete pipeline with all options", () => {
    const source = createMockSource("source");
    const route = createMockRoute("route");
    const include = vi.fn().mockReturnValue(true);
    const onEvent = vi.fn();
    const fallback: FallbackRouteDefinition = {
      parser: mockParser,
      resolver: async () => [],
    };

    const pipeline = definePipeline({
      id: "complete-pipeline",
      name: "Complete Pipeline",
      description: "A fully configured pipeline",
      versions: ["16.0.0", "15.1.0"],
      inputs: [source],
      routes: [route],
      include,
      strict: true,
      concurrency: 2,
      fallback,
      onEvent,
    });

    expect(pipeline._type).toBe("pipeline-definition");
    expect(pipeline.id).toBe("complete-pipeline");
    expect(pipeline.name).toBe("Complete Pipeline");
    expect(pipeline.description).toBe("A fully configured pipeline");
    expect(pipeline.versions).toHaveLength(2);
    expect(pipeline.inputs).toHaveLength(1);
    expect(pipeline.routes).toHaveLength(1);
    expect(pipeline.include).toBe(include);
    expect(pipeline.strict).toBe(true);
    expect(pipeline.concurrency).toBe(2);
    expect(pipeline.fallback).toBe(fallback);
    expect(pipeline.onEvent).toBe(onEvent);
  });
});

describe("isPipelineDefinition", () => {
  it("should return true for valid pipeline definition", () => {
    const pipeline = definePipeline({
      id: "test",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
    });

    expect(isPipelineDefinition(pipeline)).toBe(true);
  });

  it("should return false for null", () => {
    expect(isPipelineDefinition(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isPipelineDefinition(undefined)).toBe(false);
  });

  it("should return false for primitive types", () => {
    expect(isPipelineDefinition("string")).toBe(false);
    expect(isPipelineDefinition(123)).toBe(false);
    expect(isPipelineDefinition(true)).toBe(false);
  });

  it("should return false for empty object", () => {
    expect(isPipelineDefinition({})).toBe(false);
  });

  it("should return false for object without _type", () => {
    const notPipeline = {
      id: "test",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
    };

    expect(isPipelineDefinition(notPipeline)).toBe(false);
  });

  it("should return false for object with wrong _type", () => {
    const notPipeline = {
      _type: "not-a-pipeline",
      id: "test",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
    };

    expect(isPipelineDefinition(notPipeline)).toBe(false);
  });

  it("should return false for array", () => {
    expect(isPipelineDefinition([])).toBe(false);
  });

  it("should work as type guard", () => {
    const unknown: unknown = definePipeline({
      id: "guarded",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
    });

    if (isPipelineDefinition(unknown)) {
      expect(unknown.id).toBe("guarded");
      expect(unknown._type).toBe("pipeline-definition");
    } else {
      throw new Error("Expected valid pipeline definition");
    }
  });
});

describe("getPipelineRouteIds", () => {
  it("should return empty array for pipeline with no routes", () => {
    const pipeline = definePipeline({
      id: "no-routes",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
    });

    const routeIds = getPipelineRouteIds(pipeline);

    expect(routeIds).toEqual([]);
  });

  it("should return route ids for pipeline with routes", () => {
    const route1 = createMockRoute("route-a");
    const route2 = createMockRoute("route-b");
    const route3 = createMockRoute("route-c");

    const pipeline = definePipeline({
      id: "with-routes",
      versions: ["16.0.0"],
      inputs: [],
      routes: [route1, route2, route3],
    });

    const routeIds = getPipelineRouteIds(pipeline);

    expect(routeIds).toEqual(["route-a", "route-b", "route-c"]);
  });

  it("should preserve route order", () => {
    const routes = [
      createMockRoute("third"),
      createMockRoute("first"),
      createMockRoute("second"),
    ];

    const pipeline = definePipeline({
      id: "ordered",
      versions: ["16.0.0"],
      inputs: [],
      routes,
    });

    const routeIds = getPipelineRouteIds(pipeline);

    expect(routeIds).toEqual(["third", "first", "second"]);
  });
});

describe("getPipelineSourceIds", () => {
  it("should return empty array for pipeline with no sources", () => {
    const pipeline = definePipeline({
      id: "no-sources",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
    });

    const sourceIds = getPipelineSourceIds(pipeline);

    expect(sourceIds).toEqual([]);
  });

  it("should return source ids for pipeline with sources", () => {
    const source1 = createMockSource("source-a");
    const source2 = createMockSource("source-b");

    const pipeline = definePipeline({
      id: "with-sources",
      versions: ["16.0.0"],
      inputs: [source1, source2],
      routes: [],
    });

    const sourceIds = getPipelineSourceIds(pipeline);

    expect(sourceIds).toEqual(["source-a", "source-b"]);
  });

  it("should preserve source order", () => {
    const sources = [
      createMockSource("z-source"),
      createMockSource("a-source"),
      createMockSource("m-source"),
    ];

    const pipeline = definePipeline({
      id: "ordered",
      versions: ["16.0.0"],
      inputs: sources,
      routes: [],
    });

    const sourceIds = getPipelineSourceIds(pipeline);

    expect(sourceIds).toEqual(["z-source", "a-source", "m-source"]);
  });
});

describe("pipeline definition properties", () => {
  it("should have readonly _type property", () => {
    const pipeline = definePipeline({
      id: "readonly-test",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
    });

    expect(pipeline._type).toBe("pipeline-definition");
  });

  it("should include all provided inputs", () => {
    const sources = [
      createMockSource("unicode"),
      createMockSource("cldr"),
      createMockSource("local"),
    ];

    const pipeline = definePipeline({
      id: "multi-source",
      versions: ["16.0.0"],
      inputs: sources,
      routes: [],
    });

    expect(pipeline.inputs).toHaveLength(3);
    sources.forEach((source, i) => {
      expect(pipeline.inputs[i]).toBe(source);
    });
  });

  it("should include all provided routes", () => {
    const routes = [
      createMockRoute("line-break"),
      createMockRoute("scripts"),
      createMockRoute("blocks"),
    ];

    const pipeline = definePipeline({
      id: "multi-route",
      versions: ["16.0.0"],
      inputs: [],
      routes,
    });

    expect(pipeline.routes).toHaveLength(3);
    routes.forEach((route, i) => {
      expect(pipeline.routes[i]).toBe(route);
    });
  });
});

describe("fallback route", () => {
  it("should have parser and resolver", () => {
    const fallback: FallbackRouteDefinition = {
      parser: mockParser,
      resolver: async () => [],
    };

    const pipeline = definePipeline({
      id: "fallback-test",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
      fallback,
    });

    expect(typeof pipeline.fallback?.parser).toBe("function");
    expect(typeof pipeline.fallback?.resolver).toBe("function");
  });

  it("should support custom output type in resolver", async () => {
    interface CustomOutput {
      raw: string;
    }

    const fallback: FallbackRouteDefinition<Record<string, never>, CustomOutput> = {
      parser: mockParser,
      resolver: async () => ({ raw: "data" }),
    };

    const pipeline = definePipeline({
      id: "custom-fallback",
      versions: ["16.0.0"],
      inputs: [],
      routes: [],
      fallback,
    });

    expect(pipeline.fallback).toBeDefined();
  });
});

describe("type inference", () => {
  it("should preserve const types for sources and routes", () => {
    const source = createMockSource("my-source");
    const route = createMockRoute("my-route");

    const pipeline = definePipeline({
      id: "typed-pipeline" as const,
      versions: ["16.0.0"],
      inputs: [source] as const,
      routes: [route] as const,
    });

    expect(pipeline.id).toBe("typed-pipeline");
    expect(pipeline.inputs).toHaveLength(1);
    expect(pipeline.routes).toHaveLength(1);
  });
});
