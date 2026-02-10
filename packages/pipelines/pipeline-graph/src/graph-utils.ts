import type {
  DAG,
  PipelineDefinition,
  PipelineGraph,
} from "@ucdjs/pipelines-core";
import { PipelineGraphBuilder } from "./builder";

/**
 * Build a pipeline graph from a pipeline definition and its DAG.
 * @param {PipelineDefinition} pipeline The pipeline definition to build the graph from.
 * @param {DAG} dag The DAG representing the dependencies between routes and artifacts in the pipeline.
 * @returns {PipelineGraph} The constructed pipeline graph.
 */
export function buildRouteGraph(
  pipeline: PipelineDefinition,
  dag: DAG,
): PipelineGraph {
  const builder = new PipelineGraphBuilder();

  for (const route of pipeline.routes) {
    const routeNode = dag.nodes.get(route.id);
    if (!routeNode) continue;

    const currentRouteId = builder.addRouteNode(route.id, "static");

    for (const depId of routeNode.dependencies) {
      const depNodeId = builder.addRouteNode(depId, "static");
      builder.addEdge(depNodeId, currentRouteId, "provides");
    }

    for (const artifactId of routeNode.emittedArtifacts) {
      const artifactNodeId = builder.addArtifactNode(artifactId, "static");
      builder.addEdge(currentRouteId, artifactNodeId, "resolved");
    }
  }

  return builder.build();
}

const END_LINE = "└─ ";
const MID_LINE = "├─ ";
const VERTICAL_LINE = "│  ";
const EMPTY_SPACE = "   ";

/**
 * Convert a pipeline graph into a visual tree representation.
 * @param {PipelineGraph} graph The pipeline graph to convert.
 * @returns {string} A visual tree representation of the graph.
 */
export function toVisualTree(graph: PipelineGraph): string {
  const adjacencyList = new Map<string, string[]>();
  const incomingCount = new Map<string, number>();

  graph.nodes.forEach((node) => {
    incomingCount.set(node.id, 0);
  });

  for (const edge of graph.edges) {
    if (!adjacencyList.has(edge.from)) {
      adjacencyList.set(edge.from, []);
    }
    adjacencyList.get(edge.from)!.push(edge.to);
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

    const children = adjacencyList.get(nodeId) ?? [];
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

/**
 * Find a node in the graph by its ID.
 * @param {PipelineGraph} graph The pipeline graph to search within.
 * @param {string} nodeId The ID of the node to find.
 * @returns {PipelineGraph["nodes"][number] | undefined} The node with the specified ID, or undefined if not found.
 */
export function find(graph: PipelineGraph, nodeId: string): PipelineGraph["nodes"][number] | undefined {
  return graph.nodes.find((node) => node.id === nodeId);
}

/**
 * Find edges between two nodes in the graph.
 * @param {PipelineGraph} graph The pipeline graph to search within.
 * @param {string} from The ID of the source node.
 * @param {string} to The ID of the target node.
 * @returns {PipelineGraph["edges"]} An array of edges from the source node to the target node.
 */
export function findEdges(graph: PipelineGraph, from: string, to: string): PipelineGraph["edges"] {
  return graph.edges.filter((edge) => edge.from === from && edge.to === to);
}
