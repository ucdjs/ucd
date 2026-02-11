import type { PipelineFlowEdge, PipelineFlowNode } from "./adapter";

const NODE_WIDTH = 180;

const NODE_HEIGHT = 60;

const HORIZONTAL_GAP = 80;

const VERTICAL_GAP = 40;

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

  const nodeIds = new Set(nodes.map((n) => n.id));

  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      incomingEdges.get(edge.target)?.add(edge.source);
      outgoingEdges.get(edge.source)?.add(edge.target);
    }
  }

  const layers = new Map<string, number>();
  const rootNodes = nodes.filter((n) => incomingEdges.get(n.id)?.size === 0);

  const firstNode = nodes[0];
  const queue: Array<{ id: string; layer: number }> = rootNodes.length > 0
    ? rootNodes.map((n) => ({ id: n.id, layer: 0 }))
    : firstNode ? [{ id: firstNode.id, layer: 0 }] : [];

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) {
      continue;
    }
    const { id, layer } = item;

    if (!layers.has(id) || layers.get(id)! < layer) {
      layers.set(id, layer);

      for (const childId of outgoingEdges.get(id) || []) {
        queue.push({ id: childId, layer: layer + 1 });
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

    for (let i = 0; i < layerNodes.length; i++) {
      const node = layerNodes[i];
      if (!node) {
        continue;
      }
      const y = startY + i * (NODE_HEIGHT + VERTICAL_GAP);

      const positionedNode: PipelineFlowNode = {
        ...node,
        position: { x, y },
      };
      positionedNodes.set(node.id, positionedNode);
    }
  }

  return nodes.map((n) => positionedNodes.get(n.id) ?? n);
}

export { NODE_HEIGHT, NODE_WIDTH };
