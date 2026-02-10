import {
  buildDAG,
  definePipeline,
} from "@ucdjs/pipelines-core";
import { describe, expect, it } from "vitest";
import { createMockRoute } from "../../pipeline-core/test/_test-utils";
import {
  buildRouteGraph,
  PipelineGraphBuilder,
  toVisualTree,
} from "../src";

describe("buildRouteGraph", () => {
  it("should build route dependency edges", () => {
    const routes = [
      createMockRoute("route-a"),
      createMockRoute("route-b", { depends: ["route:route-a"] }),
    ];

    const pipeline = definePipeline({
      id: "graph-pipeline",
      name: "Graph Pipeline",
      versions: ["16.0.0"],
      inputs: [],
      routes,
    });

    const dagResult = buildDAG(routes);
    expect(dagResult.valid).toBe(true);

    const graph = buildRouteGraph(pipeline, dagResult.dag!);

    const expected = new PipelineGraphBuilder();
    expected.addRouteNode("route-a", "static");
    expected.addRouteNode("route-b", "static");
    expected.addEdge("route:static:route-a", "route:static:route-b", "provides");

    expect(graph).toEqual(expected.build());
  });

  it("should add artifact nodes and resolved edges", () => {
    const emits = {
      meta: { _type: "artifact" as const, schema: {} as unknown, scope: "version" as const },
    };
    const routes = [
      createMockRoute("producer", { emits: emits as any }),
      createMockRoute("consumer", { depends: ["artifact:producer:meta"] }),
    ];

    const pipeline = definePipeline({
      id: "artifact-pipeline",
      name: "Artifact Pipeline",
      versions: ["16.0.0"],
      inputs: [],
      routes,
    });

    const dagResult = buildDAG(routes);
    expect(dagResult.valid).toBe(true);

    const graph = buildRouteGraph(pipeline, dagResult.dag!);

    const expected = new PipelineGraphBuilder();
    expected.addRouteNode("producer", "static");
    expected.addArtifactNode("producer:meta", "static");
    expected.addRouteNode("consumer", "static");
    expected.addEdge("route:static:producer", "artifact:static:producer:meta", "resolved");
    expected.addEdge("route:static:producer", "route:static:consumer", "provides");

    expect(graph).toEqual(expected.build());
  });
});

describe("toVisualTree", () => {
  it("should render a visual tree", () => {
    const builder = new PipelineGraphBuilder();
    builder.addRouteNode("oranges", "static");
    builder.addRouteNode("mandarin", "static");
    builder.addRouteNode("clementine", "static");
    builder.addRouteNode("tangerine: so cheap and juicy!", "static");
    builder.addRouteNode("apples", "static");
    builder.addRouteNode("gala", "static");
    builder.addRouteNode("pink lady", "static");
    builder.addEdge("route:static:oranges", "route:static:mandarin", "provides");
    builder.addEdge("route:static:mandarin", "route:static:clementine", "provides");
    builder.addEdge("route:static:mandarin", "route:static:tangerine: so cheap and juicy!", "provides");
    builder.addEdge("route:static:apples", "route:static:gala", "provides");
    builder.addEdge("route:static:apples", "route:static:pink lady", "provides");

    const tree = toVisualTree(builder.build());

    expect(tree).toBe(
      "├─ route:static:oranges\n"
        + "│  └─ route:static:mandarin\n"
        + "│     ├─ route:static:clementine\n"
        + "│     └─ route:static:tangerine: so cheap and juicy!\n"
        + "└─ route:static:apples\n"
        + "   ├─ route:static:gala\n"
        + "   └─ route:static:pink lady",
    );
  });
});
