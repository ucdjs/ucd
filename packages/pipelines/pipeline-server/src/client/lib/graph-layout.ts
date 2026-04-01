import type { Edge, Node } from "@xyflow/react";

const DEFAULT_HORIZONTAL_GAP = 80;
const DEFAULT_VERTICAL_GAP = 40;

export interface LayoutOptions {
  nodeWidth: number;
  nodeHeight: number;
  horizontalGap?: number;
  verticalGap?: number;
}

interface GraphIndex {
  incomingCount: Map<string, number>;
  outgoing: Map<string, string[]>;
}

/**
 * Applies a left-to-right layered layout to a set of nodes and edges.
 * Works with any ReactFlow node type - only reads `id`, `position`, `width`, `height`.
 */
export function applyLayeredLayout<N extends Node>(
  nodes: N[],
  edges: Edge[],
  options: LayoutOptions,
): N[] {
  if (nodes.length === 0) return nodes;

  const { nodeWidth, nodeHeight, horizontalGap = DEFAULT_HORIZONTAL_GAP, verticalGap = DEFAULT_VERTICAL_GAP } = options;
  const graphIndex = buildGraphIndex(nodes, edges);
  const layers = assignLayers(nodes, graphIndex);
  return positionLayers(nodes, layers, nodeWidth, nodeHeight, horizontalGap, verticalGap);
}

function buildGraphIndex<N extends Node>(
  nodes: N[],
  edges: Edge[],
): GraphIndex {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const incomingCount = new Map(nodes.map((n) => [n.id, 0]));
  const outgoing = new Map(nodes.map((n) => [n.id, [] as string[]]));

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    outgoing.get(edge.source)?.push(edge.target);
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
  }

  return { incomingCount, outgoing };
}

function assignLayers<N extends Node>(
  nodes: N[],
  graphIndex: GraphIndex,
): Map<string, number> {
  const layers = new Map<string, number>();
  const roots = nodes.filter((n) => (graphIndex.incomingCount.get(n.id) ?? 0) === 0);
  const queue = (roots.length > 0 ? roots : nodes.slice(0, 1)).map((n) => n.id);

  for (const nodeId of queue) {
    layers.set(nodeId, 0);
  }

  const visited = new Set<string>();
  for (let i = 0; i < queue.length; i += 1) {
    const nodeId = queue[i];
    if (!nodeId || visited.has(nodeId)) continue;
    visited.add(nodeId);

    const layer = layers.get(nodeId) ?? 0;

    for (const childId of graphIndex.outgoing.get(nodeId) ?? []) {
      const nextLayer = layer + 1;
      if (nextLayer > (layers.get(childId) ?? -1)) {
        layers.set(childId, nextLayer);
        queue.push(childId);
      }
    }
  }

  for (const node of nodes) {
    if (!layers.has(node.id)) {
      layers.set(node.id, 0);
    }
  }

  return layers;
}

function positionLayers<N extends Node>(
  nodes: N[],
  layers: Map<string, number>,
  nodeWidth: number,
  nodeHeight: number,
  horizontalGap: number,
  verticalGap: number,
): N[] {
  const layerGroups = new Map<number, N[]>();

  for (const node of nodes) {
    const layer = layers.get(node.id) ?? 0;
    const group = layerGroups.get(layer);
    if (group) {
      group.push(node);
    } else {
      layerGroups.set(layer, [node]);
    }
  }

  const positionedNodes = new Map<string, N>();
  const sortedLayers = [...layerGroups.entries()].toSorted((a, b) => a[0] - b[0]);

  for (const [layerIndex, layerNodes] of sortedLayers) {
    const x = layerIndex * (nodeWidth + horizontalGap);
    const layerHeight = layerNodes.length * (nodeHeight + verticalGap) - verticalGap;
    const startY = -layerHeight / 2;

    for (let i = 0; i < layerNodes.length; i += 1) {
      const node = layerNodes[i];
      if (!node) continue;

      positionedNodes.set(node.id, {
        ...node,
        position: {
          x,
          y: startY + i * (nodeHeight + verticalGap),
        },
      });
    }
  }

  return nodes.map((node) => positionedNodes.get(node.id) ?? node);
}
