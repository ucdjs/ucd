import type {
  PipelineGraph,
  PipelineGraphEdge,
  PipelineGraphNode,
  PipelineGraphNodeType,
} from "@ucdjs/pipelines-core";

import type { Edge, Node } from "@xyflow/react";

export interface PipelineFlowNode extends Node {
  data: {
    pipelineNode: PipelineGraphNode;
    label: string;
  };

  type: PipelineGraphNodeType;
}

export interface PipelineFlowEdge extends Edge {
  data: {
    pipelineEdge: PipelineGraphEdge;
  };
}

function getNodeLabel(node: PipelineGraphNode): string {
  switch (node.type) {
    case "source":
      return `v${node.version}`;
    case "file":
      return node.file.name;
    case "route":
      return node.routeId;
    case "artifact":
      return node.artifactId;
    case "output":
      return node.property
        ? `Output[${node.outputIndex}].${node.property}`
        : `Output[${node.outputIndex}]`;
  }
}

function getEdgeStyle(edgeType: PipelineGraphEdge["type"]): Pick<Edge, "animated" | "style"> {
  const baseStyle = { strokeWidth: 2 };

  switch (edgeType) {
    case "provides":
      return { style: { ...baseStyle, stroke: "#6366f1" } };
    case "matched":
      return { style: { ...baseStyle, stroke: "#22c55e" } };
    case "parsed":
      return { style: { ...baseStyle, stroke: "#f59e0b" } };
    case "resolved":
      return { style: { ...baseStyle, stroke: "#3b82f6" } };
    case "uses-artifact":
      return { style: { ...baseStyle, stroke: "#8b5cf6" }, animated: true };
    default:
      return { style: baseStyle };
  }
}

export function pipelineGraphToFlow(
  graph: PipelineGraph,
): { nodes: PipelineFlowNode[]; edges: PipelineFlowEdge[] } {
  const nodes: PipelineFlowNode[] = graph.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: { x: 0, y: 0 },
    data: {
      pipelineNode: node,
      label: getNodeLabel(node),
    },
  }));

  const edges: PipelineFlowEdge[] = graph.edges.map((edge, index) => ({
    id: `edge-${index}-${edge.from}-${edge.to}`,
    source: edge.from,
    target: edge.to,
    label: edge.type,
    ...getEdgeStyle(edge.type),
    data: {
      pipelineEdge: edge,
    },
  }));

  return { nodes, edges };
}

export function filterNodesByType(
  nodes: PipelineFlowNode[],
  edges: PipelineFlowEdge[],
  visibleTypes: Set<PipelineGraphNodeType>,
): { nodes: PipelineFlowNode[]; edges: PipelineFlowEdge[] } {
  const filteredNodes = nodes.filter((node) => visibleTypes.has(node.type as PipelineGraphNodeType));
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  const filteredEdges = edges.filter(
    (edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target),
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}
