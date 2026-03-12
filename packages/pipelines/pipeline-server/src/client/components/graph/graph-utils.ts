import type { ExecutionGraphEdgeView, ExecutionGraphNodeView, ExecutionGraphView } from "#shared/schemas/graph";
import type { PipelineGraphNodeType } from "@ucdjs/pipelines-core";
import type { Edge, Node } from "@xyflow/react";
import { getGraphEdgeStyle, getNodeColor } from "#shared/lib/graph";

export interface PipelineFlowNode extends Node {
  data: {
    graphNode: ExecutionGraphNodeView;
  };
  type: ExecutionGraphNodeView["flowType"];
}

export interface PipelineFlowEdge extends Edge {
  data: {
    graphEdge: ExecutionGraphEdgeView;
  };
}

// These dimensions intentionally match the custom node shell in nodes.tsx.
// The layout is static, so visual overlap appears immediately if these drift.
export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 64;

const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 40;

interface GraphIndex {
  incomingCount: Map<string, number>;
  outgoing: Map<string, string[]>;
}

export function pipelineGraphToFlow(
  graph: ExecutionGraphView,
): { nodes: PipelineFlowNode[]; edges: PipelineFlowEdge[] } {
  const nodes: PipelineFlowNode[] = graph.nodes.map((node) => ({
    id: node.id,
    type: node.flowType,
    position: { x: 0, y: 0 },
    data: {
      graphNode: node,
    },
  }));

  const edges: PipelineFlowEdge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    ...getGraphEdgeStyle(edge.edgeType),
    data: {
      graphEdge: edge,
    },
  }));

  return { nodes, edges };
}

export function filterNodesByType(
  nodes: PipelineFlowNode[],
  edges: PipelineFlowEdge[],
  visibleTypes: Set<PipelineGraphNodeType>,
): { nodes: PipelineFlowNode[]; edges: PipelineFlowEdge[] } {
  const filteredNodes = nodes.filter((node) => visibleTypes.has(node.data.graphNode.nodeType));
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

  const graphIndex = buildGraphIndex(nodes, edges);
  const layers = assignLayers(nodes, graphIndex);
  return positionLayers(nodes, layers);
}

export { getNodeColor };

function buildGraphIndex(
  nodes: PipelineFlowNode[],
  edges: PipelineFlowEdge[],
): GraphIndex {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const incomingCount = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, [] as string[]]));

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      continue;
    }

    outgoing.get(edge.source)?.push(edge.target);
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
  }

  return { incomingCount, outgoing };
}

function assignLayers(
  nodes: PipelineFlowNode[],
  graphIndex: GraphIndex,
): Map<string, number> {
  const layers = new Map<string, number>();
  const roots = nodes.filter((node) => (graphIndex.incomingCount.get(node.id) ?? 0) === 0);
  const queue = (roots.length > 0 ? roots : nodes.slice(0, 1)).map((node) => node.id);

  for (const nodeId of queue) {
    layers.set(nodeId, 0);
  }

  for (let index = 0; index < queue.length; index += 1) {
    const nodeId = queue[index];
    if (!nodeId) continue;

    const layer = layers.get(nodeId) ?? 0;

    for (const childId of graphIndex.outgoing.get(nodeId) ?? []) {
      const nextLayer = layer + 1;
      if (nextLayer > (layers.get(childId) ?? -1)) {
        layers.set(childId, nextLayer);
      }

      queue.push(childId);
    }
  }

  for (const node of nodes) {
    if (!layers.has(node.id)) {
      layers.set(node.id, 0);
    }
  }

  return layers;
}

function positionLayers(
  nodes: PipelineFlowNode[],
  layers: Map<string, number>,
): PipelineFlowNode[] {
  const layerGroups = new Map<number, PipelineFlowNode[]>();

  for (const node of nodes) {
    const layer = layers.get(node.id) ?? 0;
    const group = layerGroups.get(layer);

    if (group) {
      group.push(node);
    } else {
      layerGroups.set(layer, [node]);
    }
  }

  const positionedNodes = new Map<string, PipelineFlowNode>();
  const sortedLayers = Array.from(layerGroups.entries()).sort((a, b) => a[0] - b[0]);

  for (const [layerIndex, layerNodes] of sortedLayers) {
    const x = layerIndex * (NODE_WIDTH + HORIZONTAL_GAP);
    const layerHeight = layerNodes.length * (NODE_HEIGHT + VERTICAL_GAP) - VERTICAL_GAP;
    const startY = -layerHeight / 2;

    for (let index = 0; index < layerNodes.length; index += 1) {
      const node = layerNodes[index];
      if (!node) continue;

      positionedNodes.set(node.id, {
        ...node,
        position: {
          x,
          y: startY + index * (NODE_HEIGHT + VERTICAL_GAP),
        },
      });
    }
  }

  return nodes.map((node) => positionedNodes.get(node.id) ?? node);
}
