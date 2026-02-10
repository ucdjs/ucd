import type {
  DAG,
  PipelineDefinition,
  PipelineGraph,
} from "@ucdjs/pipelines-core";
import { PipelineGraphBuilder } from "./builder";

const END_LINE = "└─ ";
const MID_LINE = "├─ ";
const VERTICAL_LINE = "│  ";
const EMPTY_SPACE = "   ";

export function buildRouteGraph(
  pipeline: PipelineDefinition,
  dag: DAG,
): PipelineGraph {
  const builder = new PipelineGraphBuilder();

  for (const route of pipeline.routes) {
    const routeNode = dag.nodes.get(route.id);
    if (!routeNode) continue;

    builder.addRouteNode(route.id, "static");

    for (const depId of routeNode.dependencies) {
      builder.addRouteNode(depId, "static");
      builder.addEdge(`route:static:${depId}`, `route:static:${route.id}`, "provides");
    }

    for (const artifactId of routeNode.emittedArtifacts) {
      builder.addArtifactNode(artifactId, "static");
      builder.addEdge(`route:static:${route.id}`, `artifact:static:${artifactId}`, "resolved");
    }
  }

  return builder.build();
}

export function toVisualTree(graph: PipelineGraph): string {
  const adjacencyList: Record<string, string[]> = {};
  const incomingCount = new Map<string, number>();

  for (const node of graph.nodes) {
    incomingCount.set(node.id, 0);
  }

  for (const edge of graph.edges) {
    (adjacencyList[edge.from] ??= []).push(edge.to);
    incomingCount.set(edge.to, (incomingCount.get(edge.to) ?? 0) + 1);
    if (!incomingCount.has(edge.from)) {
      incomingCount.set(edge.from, 0);
    }
  }

  const nodeIds = graph.nodes.map((node) => node.id);
  const rootIds = nodeIds.filter((id) => (incomingCount.get(id) ?? 0) === 0);
  const orderedRoots = rootIds.length > 0 ? rootIds : nodeIds;

  const lines: string[] = [];
  const visited = new Set<string>();

  function buildTree(nodeId: string, prefix: string, isLast: boolean): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    lines.push(`${prefix}${isLast ? END_LINE : MID_LINE}${nodeId}`);

    const children = adjacencyList[nodeId] || [];
    const nextPrefix = prefix + (isLast ? EMPTY_SPACE : VERTICAL_LINE);
    children.forEach((childId, index) => {
      buildTree(childId, nextPrefix, index === children.length - 1);
    });
  }

  orderedRoots.forEach((rootId, index) => {
    buildTree(rootId, "", index === orderedRoots.length - 1);
  });

  const remaining = nodeIds.filter((id) => !visited.has(id));
  remaining.forEach((nodeId, index) => {
    buildTree(nodeId, "", index === remaining.length - 1);
  });

  return lines.join("\n");
}
