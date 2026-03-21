import type { PipelineDetails } from "#shared/schemas/pipeline";
import type { Edge, Node } from "@xyflow/react";

export interface DefinitionFlowNode extends Node {
  data: {
    routeId: string;
    route: PipelineDetails["routes"][number];
  };
  type: "definition-route";
}

export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 56;

const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 40;

interface GraphIndex {
  incomingCount: Map<string, number>;
  outgoing: Map<string, string[]>;
}

export function pipelineDefinitionToFlow(
  pipeline: PipelineDetails,
): { nodes: DefinitionFlowNode[]; edges: Edge[] } {
  const nodes: DefinitionFlowNode[] = pipeline.routes.map((route) => ({
    id: route.id,
    type: "definition-route" as const,
    position: { x: 0, y: 0 },
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    data: {
      routeId: route.id,
      route,
    },
  }));

  const routeIds = new Set(pipeline.routes.map((route) => route.id));
  const edges: Edge[] = [];

  for (const route of pipeline.routes) {
    for (const dep of route.depends) {
      if (dep.type === "route" && routeIds.has(dep.routeId)) {
        edges.push({
          id: `${dep.routeId}->${route.id}`,
          source: dep.routeId,
          target: route.id,
          style: { strokeWidth: 2 },
        });
      } else if (dep.type === "artifact" && routeIds.has(dep.routeId)) {
        edges.push({
          id: `${dep.routeId}:${dep.artifactName}->${route.id}`,
          source: dep.routeId,
          target: route.id,
          style: { strokeWidth: 2, strokeDasharray: "6 3" },
        });
      }
    }
  }

  return { nodes, edges };
}

export function applyDefinitionLayout(
  nodes: DefinitionFlowNode[],
  edges: Edge[],
): DefinitionFlowNode[] {
  if (nodes.length === 0) {
    return nodes;
  }

  const graphIndex = buildGraphIndex(nodes, edges);
  const layers = assignLayers(nodes, graphIndex);
  return positionLayers(nodes, layers);
}

export function filterToNeighbors(
  nodes: DefinitionFlowNode[],
  edges: Edge[],
  selectedRouteId: string,
): { nodes: DefinitionFlowNode[]; edges: Edge[] } {
  const neighborIds = new Set<string>([selectedRouteId]);

  for (const edge of edges) {
    if (edge.source === selectedRouteId) {
      neighborIds.add(edge.target);
    }
    if (edge.target === selectedRouteId) {
      neighborIds.add(edge.source);
    }
  }

  const filteredNodes = nodes.filter((node) => neighborIds.has(node.id));
  const filteredEdges = edges.filter(
    (edge) => neighborIds.has(edge.source) && neighborIds.has(edge.target),
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}

function buildGraphIndex(
  nodes: DefinitionFlowNode[],
  edges: Edge[],
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
  nodes: DefinitionFlowNode[],
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
  nodes: DefinitionFlowNode[],
  layers: Map<string, number>,
): DefinitionFlowNode[] {
  const layerGroups = new Map<number, DefinitionFlowNode[]>();

  for (const node of nodes) {
    const layer = layers.get(node.id) ?? 0;
    const group = layerGroups.get(layer);

    if (group) {
      group.push(node);
    } else {
      layerGroups.set(layer, [node]);
    }
  }

  const positionedNodes = new Map<string, DefinitionFlowNode>();
  const sortedLayers = [...layerGroups.entries()].toSorted((a, b) => a[0] - b[0]);

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
