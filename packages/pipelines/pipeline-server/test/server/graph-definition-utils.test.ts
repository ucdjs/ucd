import type { PipelineDetails } from "../../src/shared/schemas/pipeline";
import { describe, expect, it } from "vitest";
import {
  applyDefinitionLayout,
  definitionGraphToFlow,
  filterToNeighbors,
} from "../../src/client/lib/graph-utils";

function makePipeline(routes: PipelineDetails["routes"]): PipelineDetails {
  return {
    id: "test-pipeline",
    versions: ["1.0.0"],
    routeCount: routes.length,
    sourceCount: 1,
    routes,
    sources: [{ id: "local" }],
  };
}

const samplePipeline = makePipeline([
  {
    id: "compile",
    cache: true,
    depends: [],
    filter: "byName('data.txt')",
    outputs: [{ dir: "dist", fileName: "data.json" }],
    transforms: ["normalize", "dedupe"],
  },
  {
    id: "publish",
    cache: false,
    depends: [{ type: "route", routeId: "compile" }],
    filter: "byExt('.txt')",
    outputs: [{ dir: "release", fileName: "bundle.txt" }, { dir: "release", fileName: "meta.json" }],
    transforms: ["ship"],
  },
  {
    id: "archive",
    cache: false,
    depends: [{ type: "route", routeId: "compile" }],
    outputs: [],
    transforms: [],
  },
]);

describe("definitionGraphToFlow", () => {
  it("creates a route node per pipeline route", () => {
    const { nodes } = definitionGraphToFlow(samplePipeline);

    expect(nodes).toHaveLength(3);
    expect(nodes.map((n) => n.id)).toEqual(["compile", "publish", "archive"]);
    expect(nodes.every((n) => n.type === "definition-route")).toBe(true);
    expect(nodes.every((n) => n.data.kind === "definition-route")).toBe(true);
  });

  it("creates edges for route dependencies", () => {
    const { edges } = definitionGraphToFlow(samplePipeline);

    const publishEdge = edges.find((e) => e.source === "compile" && e.target === "publish");
    expect(publishEdge).toBeDefined();
    expect(publishEdge!.style?.strokeWidth).toBe(2);

    const archiveEdge = edges.find((e) => e.source === "compile" && e.target === "archive");
    expect(archiveEdge).toBeDefined();
    expect(archiveEdge!.style?.strokeWidth).toBe(2);
  });

  it("does not include output nodes by default", () => {
    const { nodes } = definitionGraphToFlow(samplePipeline);
    expect(nodes.some((n) => n.data.kind === "definition-output")).toBe(false);
  });

  it("includes output nodes when includeOutputs is true", () => {
    const { nodes, edges } = definitionGraphToFlow(samplePipeline, { includeOutputs: true });

    const outputNodes = nodes.filter((n) => n.data.kind === "definition-output");
    expect(outputNodes).toHaveLength(3);

    const compileOutput = outputNodes.find((n) => n.id === "output:compile:0");
    expect(compileOutput).toBeDefined();
    expect(compileOutput!.data.kind).toBe("definition-output");
    if (compileOutput!.data.kind === "definition-output") {
      expect(compileOutput!.data.outputKey).toBe("compile:0");
      expect(compileOutput!.data.fileName).toBe("data.json");
      expect(compileOutput!.data.dir).toBe("dist");
    }

    const outputEdges = edges.filter((e) => e.target.startsWith("output:"));
    expect(outputEdges).toHaveLength(3);
  });

  it("handles a pipeline with no routes", () => {
    const { nodes, edges } = definitionGraphToFlow(makePipeline([]));
    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
  });

  it("sets route data on definition-route nodes", () => {
    const { nodes } = definitionGraphToFlow(samplePipeline);
    const compile = nodes.find((n) => n.id === "compile")!;
    expect(compile.data.kind).toBe("definition-route");
    if (compile.data.kind === "definition-route") {
      expect(compile.data.routeId).toBe("compile");
      expect(compile.data.route.transforms).toEqual(["normalize", "dedupe"]);
      expect(compile.data.route.cache).toBe(true);
    }
  });
});

describe("filterToNeighbors", () => {
  it("returns the selected node and its direct neighbors", () => {
    const { nodes, edges } = definitionGraphToFlow(samplePipeline);
    const filtered = filterToNeighbors(nodes, edges, "publish");

    expect(filtered.nodes.map((n) => n.id).sort()).toEqual(["compile", "publish"]);
    expect(filtered.edges).toHaveLength(1);
  });

  it("returns only the selected node when it has no neighbors", () => {
    const lonely = makePipeline([
      { id: "solo", cache: false, depends: [], outputs: [], transforms: [] },
    ]);
    const { nodes, edges } = definitionGraphToFlow(lonely);
    const filtered = filterToNeighbors(nodes, edges, "solo");

    expect(filtered.nodes).toHaveLength(1);
    expect(filtered.edges).toHaveLength(0);
  });

  it("includes output nodes as neighbors when they exist", () => {
    const { nodes, edges } = definitionGraphToFlow(samplePipeline, { includeOutputs: true });
    const filtered = filterToNeighbors(nodes, edges, "compile");

    const ids = filtered.nodes.map((n) => n.id).sort();
    expect(ids).toContain("compile");
    expect(ids).toContain("publish");
    expect(ids).toContain("output:compile:0");
  });
});

describe("applyDefinitionLayout", () => {
  it("positions all nodes", () => {
    const { nodes, edges } = definitionGraphToFlow(samplePipeline);
    const positioned = applyDefinitionLayout(nodes, edges);

    expect(positioned).toHaveLength(3);
    expect(positioned.every((n) => n.position.x !== 0 || n.position.y !== 0 || positioned.length === 1)).toBe(true);
  });

  it("returns empty array for empty input", () => {
    expect(applyDefinitionLayout([], [])).toEqual([]);
  });
});
