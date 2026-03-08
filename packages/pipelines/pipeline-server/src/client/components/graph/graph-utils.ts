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

export const nodeTypeColors: Record<string, string> = {
  source: "#6366f1",
  file: "#10b981",
  route: "#f59e0b",
  artifact: "#8b5cf6",
  output: "#0ea5e9",
  default: "#6b7280",
};

export const NODE_WIDTH = 180;
export const NODE_HEIGHT = 60;

const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 40;

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

export function getNodeColor(node: { type?: string }): string {
  const color = nodeTypeColors[node.type ?? ""];
  return color ?? nodeTypeColors.default ?? "#6b7280";
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
  const filteredNodeIds = new Set(filteredNodes.map((node) => node.id));

  const filteredEdges = edges.filter(
    (edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target),
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}

export function applyLayout(
  nodes: PipelineFlowNode[],
  edges: PipelineFlowEdge[],
): PipelineFlowNode[] {
  if (nodes.length === 0) {
    return nodes;
  }

  const incomingEdges = new Map<string, Set<string>>();
  const outgoingEdges = new Map<string, Set<string>>();

  for (const node of nodes) {
    incomingEdges.set(node.id, new Set());
    outgoingEdges.set(node.id, new Set());
  }

  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      incomingEdges.get(edge.target)?.add(edge.source);
      outgoingEdges.get(edge.source)?.add(edge.target);
    }
  }

  const layers = new Map<string, number>();
  const rootNodes = nodes.filter((node) => incomingEdges.get(node.id)?.size === 0);
  const firstNode = nodes[0];
  const queue: Array<{ id: string; layer: number }> = rootNodes.length > 0
    ? rootNodes.map((node) => ({ id: node.id, layer: 0 }))
    : firstNode ? [{ id: firstNode.id, layer: 0 }] : [];

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) continue;

    if (!layers.has(item.id) || layers.get(item.id)! < item.layer) {
      layers.set(item.id, item.layer);

      for (const childId of outgoingEdges.get(item.id) || []) {
        queue.push({ id: childId, layer: item.layer + 1 });
      }
    }
  }

  for (const node of nodes) {
    if (!layers.has(node.id)) {
      layers.set(node.id, 0);
    }
  }

  const layerGroups = new Map<number, PipelineFlowNode[]>();
  for (const node of nodes) {
    const layer = layers.get(node.id) ?? 0;
    if (!layerGroups.has(layer)) {
      layerGroups.set(layer, []);
    }
    layerGroups.get(layer)!.push(node);
  }

  const sortedLayers = Array.from(layerGroups.entries()).sort((a, b) => a[0] - b[0]);
  const positionedNodes = new Map<string, PipelineFlowNode>();

  for (const [layerIndex, layerNodes] of sortedLayers) {
    const x = layerIndex * (NODE_WIDTH + HORIZONTAL_GAP);
    const layerHeight = layerNodes.length * (NODE_HEIGHT + VERTICAL_GAP) - VERTICAL_GAP;
    const startY = -layerHeight / 2;

    for (let index = 0; index < layerNodes.length; index += 1) {
      const node = layerNodes[index];
      if (!node) continue;

      const y = startY + index * (NODE_HEIGHT + VERTICAL_GAP);
      positionedNodes.set(node.id, {
        ...node,
        position: { x, y },
      });
    }
  }

  return nodes.map((node) => positionedNodes.get(node.id) ?? node);
}
