import type { PipelineGraph } from "@ucdjs/pipelines-core";
import { describe, expect, it } from "vitest";
import {
  buildExecutionGraphView,
  getFlowNodeType,
  getNodeColor,
  graphNodeConfig,
  graphNodeTypes,
} from "../../src/shared/lib/graph";

describe("graph-utils", () => {
  it("derives flow node types from graph node types", () => {
    expect(graphNodeTypes.map((type) => getFlowNodeType(type))).toEqual([
      "pipeline-source",
      "pipeline-file",
      "pipeline-route",
      "pipeline-artifact",
      "pipeline-output",
    ]);
  });

  it("keeps graph node config aligned with node types", () => {
    expect(Object.keys(graphNodeConfig)).toEqual(graphNodeTypes);
  });

  it("builds a shared graph view with derived labels and detail fields", () => {
    const graph: PipelineGraph = {
      nodes: [
        { id: "source-1", type: "source", version: "1.0.0" },
        { id: "output-1", type: "output", outputIndex: 0 },
      ],
      edges: [
        { from: "source-1", to: "output-1", type: "resolved" },
      ],
    };

    const view = buildExecutionGraphView(graph, {
      sourceId: "local",
      fileId: "simple",
      pipelineId: "simple",
    });

    expect(view.nodes.map((node) => node.flowType)).toEqual([
      getFlowNodeType("source"),
      getFlowNodeType("output"),
    ]);
    expect(view.nodes[0]?.detailFields).toEqual([
      { label: "Node ID", type: "text", value: "source-1" },
      { label: "Version", type: "text", value: "1.0.0" },
    ]);
    expect(view.nodes[1]?.actions).toEqual([
      {
        label: "Open outputs",
        to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect/outputs",
        params: {
          sourceId: "local",
          sourceFileId: "simple",
          pipelineId: "simple",
        },
      },
    ]);
    expect(view.edges).toHaveLength(1);
  });

  it("looks up minimap colors from flow node types", () => {
    expect(getNodeColor({ type: "pipeline-route" })).toBe(graphNodeConfig.route.color);
    expect(getNodeColor({ type: "unknown" })).toBe("#6b7280");
  });
});
