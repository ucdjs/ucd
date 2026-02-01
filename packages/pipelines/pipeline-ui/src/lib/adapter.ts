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

/**
 * Get a human-readable label for a pipeline graph node
 */
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

/**
 * Get edge style based on edge type
 */
function getEdgeStyle(edgeType: PipelineGraphEdge["type"]): Pick<Edge, "animated" | "style"> {
  const baseStyle = { strokeWidth: 2 };

  switch (edgeType) {
    case "provides":
      return { style: { ...baseStyle, stroke: "#6366f1" } }; // indigo
    case "matched":
      return { style: { ...baseStyle, stroke: "#22c55e" } }; // green
    case "parsed":
      return { style: { ...baseStyle, stroke: "#f59e0b" } }; // amber
    case "resolved":
      return { style: { ...baseStyle, stroke: "#3b82f6" } }; // blue
    case "uses-artifact":
      return { style: { ...baseStyle, stroke: "#8b5cf6" }, animated: true }; // violet, animated
    default:
      return { style: baseStyle };
  }
}

/**
 * Convert a PipelineGraph to React Flow nodes and edges
 */
export function pipelineGraphToFlow(
  graph: PipelineGraph,
): { nodes: PipelineFlowNode[]; edges: PipelineFlowEdge[] } {
  const nodes: PipelineFlowNode[] = graph.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: { x: 0, y: 0 }, // Will be set by layout
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

/**
 * Filter nodes by type
 */
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
