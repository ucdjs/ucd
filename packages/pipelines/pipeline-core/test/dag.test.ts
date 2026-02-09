import type { ParsedRow, PipelineRouteDefinition } from "../src";
import { describe, expect, it } from "vitest";
import { buildDAG, definePipelineRoute, getExecutionLayers } from "../src";

function createMockParser() {
  return async function* (): AsyncIterable<ParsedRow> {
    yield {
      sourceFile: "test.txt",
      kind: "point" as const,
      codePoint: "0041",
      value: "test",
    };
  };
}

function createRoute(
  id: string,
  depends?: (`route:${string}` | `artifact:${string}:${string}`)[],
): PipelineRouteDefinition<string, any, any, any, any> {
  return definePipelineRoute({
    id,
    filter: () => true,
    parser: createMockParser(),
    resolver: async () => [],
    depends,
  });
}

describe("buildDAG", () => {
  it("should build DAG from independent routes", () => {
    const routes = [
      createRoute("route-a"),
      createRoute("route-b"),
      createRoute("route-c"),
    ];

    const result = buildDAG(routes);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.dag).toBeDefined();
    expect(result.dag!.nodes.size).toBe(3);
  });

  it("should build DAG with route dependencies", () => {
    const routes = [
      createRoute("route-a"),
      createRoute("route-b", ["route:route-a"]),
      createRoute("route-c", ["route:route-b"]),
    ];

    const result = buildDAG(routes);

    expect(result.valid).toBe(true);
    expect(result.dag!.nodes.get("route-b")!.dependencies.has("route-a")).toBe(true);
    expect(result.dag!.nodes.get("route-c")!.dependencies.has("route-b")).toBe(true);
  });

  it("should detect circular dependencies", () => {
    const routes = [
      createRoute("route-a", ["route:route-c"]),
      createRoute("route-b", ["route:route-a"]),
      createRoute("route-c", ["route:route-b"]),
    ];

    const result = buildDAG(routes);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].type).toBe("cycle");
    expect(result.errors[0].details.cycle).toBeDefined();
  });

  it("should detect missing route dependencies", () => {
    const routes = [
      createRoute("route-a", ["route:missing"]),
    ];

    const result = buildDAG(routes);

    expect(result.valid).toBe(false);
    expect(result.errors[0].type).toBe("missing-route");
    expect(result.errors[0].details.dependencyId).toBe("missing");
  });

  it("should detect duplicate route IDs", () => {
    const routes = [
      createRoute("route-a"),
      createRoute("route-b"),
      createRoute("route-a"),
    ];

    const result = buildDAG(routes);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].type).toBe("duplicate-route");
    expect(result.errors[0].details.routeId).toBe("route-a");
    expect(result.errors[0].message).toContain("index 0 and 2");
  });

  it("should track dependents", () => {
    const routes = [
      createRoute("route-a"),
      createRoute("route-b", ["route:route-a"]),
      createRoute("route-c", ["route:route-a"]),
    ];

    const result = buildDAG(routes);

    const nodeA = result.dag!.nodes.get("route-a");
    expect(nodeA!.dependents.has("route-b")).toBe(true);
    expect(nodeA!.dependents.has("route-c")).toBe(true);
  });

  it("should generate correct execution order", () => {
    const routes = [
      createRoute("route-a"),
      createRoute("route-b", ["route:route-a"]),
      createRoute("route-c", ["route:route-b"]),
    ];

    const result = buildDAG(routes);

    expect(result.valid).toBe(true);
    const order = result.dag!.executionOrder;
    const indexA = order.indexOf("route-a");
    const indexB = order.indexOf("route-b");
    const indexC = order.indexOf("route-c");

    expect(indexA).toBeLessThan(indexB);
    expect(indexB).toBeLessThan(indexC);
  });
});

describe("getExecutionLayers", () => {
  it("should put independent routes in same layer", () => {
    const routes = [
      createRoute("route-a"),
      createRoute("route-b"),
      createRoute("route-c"),
    ];

    const result = buildDAG(routes);
    const layers = getExecutionLayers(result.dag!);

    expect(layers.length).toBe(1);
    expect(layers[0]).toHaveLength(3);
    expect(new Set(layers[0])).toEqual(new Set(["route-a", "route-b", "route-c"]));
  });

  it("should create layers based on dependencies", () => {
    const routes = [
      createRoute("route-a"),
      createRoute("route-b", ["route:route-a"]),
      createRoute("route-c", ["route:route-b"]),
    ];

    const result = buildDAG(routes);
    const layers = getExecutionLayers(result.dag!);

    expect(layers.length).toBe(3);
    expect(layers[0]).toEqual(["route-a"]);
    expect(layers[1]).toEqual(["route-b"]);
    expect(layers[2]).toEqual(["route-c"]);
  });

  it("should handle fan-in dependencies", () => {
    const routes = [
      createRoute("route-a"),
      createRoute("route-b"),
      createRoute("route-c", ["route:route-a", "route:route-b"]),
    ];

    const result = buildDAG(routes);
    const layers = getExecutionLayers(result.dag!);

    expect(layers.length).toBe(2);
    expect(layers[0].sort()).toEqual(["route-a", "route-b"]);
    expect(layers[1]).toEqual(["route-c"]);
  });

  it("should handle fan-out dependencies", () => {
    const routes = [
      createRoute("route-a"),
      createRoute("route-b", ["route:route-a"]),
      createRoute("route-c", ["route:route-a"]),
    ];

    const result = buildDAG(routes);
    const layers = getExecutionLayers(result.dag!);

    expect(layers.length).toBe(2);
    expect(layers[0]).toEqual(["route-a"]);
    expect(layers[1].sort()).toEqual(["route-b", "route-c"]);
  });

  it("should handle complex DAG", () => {
    const routes = [
      createRoute("route-a"),
      createRoute("route-b"),
      createRoute("route-c", ["route:route-a"]),
      createRoute("route-d", ["route:route-b"]),
      createRoute("route-e", ["route:route-c", "route:route-d"]),
    ];

    const result = buildDAG(routes);
    const layers = getExecutionLayers(result.dag!);

    expect(layers.length).toBe(3);
    expect(new Set(layers[0])).toEqual(new Set(["route-a", "route-b"]));
    expect(new Set(layers[1])).toEqual(new Set(["route-c", "route-d"]));
    expect(layers[2]).toEqual(["route-e"]);
  });
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("DAGNode structure", () => {
  it("should have correct node structure", () => {
    const routes = [createRoute("test-route")];

    const result = buildDAG(routes);
    const node = result.dag!.nodes.get("test-route");

    expect(node).toEqual({
      id: "test-route",
      dependencies: expect.any(Set),
      dependents: expect.any(Set),
      emittedArtifacts: expect.any(Set),
    });
  });

  it("should have empty dependencies for independent routes", () => {
    const routes = [createRoute("independent")];

    const result = buildDAG(routes);
    const node = result.dag!.nodes.get("independent");

    expect(node!.dependencies.size).toBe(0);
  });

  it("should have empty dependents for leaf nodes", () => {
    const routes = [
      createRoute("root"),
      createRoute("leaf", ["route:root"]),
    ];

    const result = buildDAG(routes);
    const node = result.dag!.nodes.get("leaf");

    expect(node!.dependents.size).toBe(0);
  });
});
