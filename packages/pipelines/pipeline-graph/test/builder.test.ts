import { describe, expect, it } from "vitest";
import { createFile } from "../../pipeline-core/test/_test-utils";
import { PipelineGraphBuilder } from "../src";
import { find } from "../src/graph-utils";

describe("graph builder", () => {
  it("should add nodes and dedupe by id", () => {
    const builder = new PipelineGraphBuilder();
    builder.addSourceNode("16.0.0");
    builder.addSourceNode("16.0.0");
    builder.addFileNode(createFile());
    builder.addRouteNode("route-a", "16.0.0");
    builder.addRouteNode("route-a", "16.0.0");
    builder.addArtifactNode("route-a:meta", "16.0.0");
    builder.addOutputNode(0, "16.0.0", "Line_Break");

    const graph = builder.build();

    expect(graph.nodes).toHaveLength(5);
    expect(find(graph, "source:16.0.0")).toBeDefined();
    expect(find(graph, "file:16.0.0:ucd/LineBreak.txt")).toBeDefined();
    expect(find(graph, "route:16.0.0:route-a")).toBeDefined();
    expect(find(graph, "artifact:16.0.0:route-a:meta")).toBeDefined();
    expect(find(graph, "output:16.0.0:0")).toBeDefined();
  });

  it("should dedupe edges", () => {
    const builder = new PipelineGraphBuilder();
    builder.addEdge("route:static:a", "route:static:b", "provides");
    builder.addEdge("route:static:a", "route:static:b", "provides");

    const graph = builder.build();

    expect(graph.edges).toHaveLength(1);
  });

  it("should clear nodes and edges", () => {
    const builder = new PipelineGraphBuilder();
    builder.addRouteNode("route-a", "16.0.0");
    builder.addEdge("route:16.0.0:route-a", "route:16.0.0:route-b", "provides");
    builder.clear();

    const graph = builder.build();

    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });
});
