import type { ExecutionGraphEdgeView, ExecutionGraphNodeView, ExecutionGraphView } from "#shared/schemas/graph";
import type { PipelineDetails } from "#shared/schemas/pipeline";
import type { PipelineGraphNodeType } from "@ucdjs/pipelines-core";
import type { Edge, Node } from "@xyflow/react";
import { getGraphEdgeStyle, getNodeColor } from "#shared/lib/graph";
import { applyLayeredLayout } from "./graph-layout";

export interface ExecutionNodeData extends Record<string, unknown> {
  kind: "execution";
  graphNode: ExecutionGraphNodeView;
}

export interface DefinitionRouteNodeData extends Record<string, unknown> {
  kind: "definition-route";
  routeId: string;
  route: PipelineDetails["routes"][number];
}

export interface DefinitionOutputNodeData extends Record<string, unknown> {
  kind: "definition-output";
  routeId: string;
  outputIndex: number;
  outputKey: string;
  dir: string;
  fileName: string;
}

export type FlowNodeData = ExecutionNodeData | DefinitionRouteNodeData | DefinitionOutputNodeData;

export type FlowNode = Node<FlowNodeData>;

export interface FlowEdge extends Edge {
  data?: {
    graphEdge?: ExecutionGraphEdgeView;
  };
}

export const EXECUTION_NODE_WIDTH = 220;
export const EXECUTION_NODE_HEIGHT = 64;

export const DEFINITION_NODE_WIDTH = 200;
export const DEFINITION_NODE_HEIGHT = 56;

export const OUTPUT_NODE_WIDTH = 160;
export const OUTPUT_NODE_HEIGHT = 44;

export function executionGraphToFlow(
  graph: ExecutionGraphView,
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = graph.nodes.map((node) => ({
    id: node.id,
    type: node.flowType,
    position: { x: 0, y: 0 },
    width: EXECUTION_NODE_WIDTH,
    height: EXECUTION_NODE_HEIGHT,
    data: {
      kind: "execution" as const,
      graphNode: node,
    },
  }));

  const edges: FlowEdge[] = graph.edges.map((edge) => ({
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

export function definitionGraphToFlow(
  pipeline: PipelineDetails,
  options?: { includeOutputs?: boolean },
): { nodes: FlowNode[]; edges: Edge[] } {
  const nodes: FlowNode[] = pipeline.routes.map((route) => ({
    id: route.id,
    type: "definition-route" as const,
    position: { x: 0, y: 0 },
    width: DEFINITION_NODE_WIDTH,
    height: DEFINITION_NODE_HEIGHT,
    data: {
      kind: "definition-route" as const,
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

  if (options?.includeOutputs) {
    for (const route of pipeline.routes) {
      for (let i = 0; i < route.outputs.length; i++) {
        const output = route.outputs[i]!;
        const outputKey = `${route.id}:${i}`;
        const nodeId = `output:${outputKey}`;

        nodes.push({
          id: nodeId,
          type: "definition-output" as const,
          position: { x: 0, y: 0 },
          width: OUTPUT_NODE_WIDTH,
          height: OUTPUT_NODE_HEIGHT,
          data: {
            kind: "definition-output" as const,
            routeId: route.id,
            outputIndex: i,
            outputKey,
            dir: output.dir ?? "Default directory",
            fileName: output.fileName ?? "Generated",
          },
        });

        edges.push({
          id: `${route.id}->output:${outputKey}`,
          source: route.id,
          target: nodeId,
          style: { strokeWidth: 1.5, strokeDasharray: "4 2" },
        });
      }
    }
  }

  return { nodes, edges };
}

export function applyExecutionLayout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  return applyLayeredLayout(nodes, edges, { nodeWidth: EXECUTION_NODE_WIDTH, nodeHeight: EXECUTION_NODE_HEIGHT });
}

export function applyDefinitionLayout(nodes: FlowNode[], edges: Edge[]): FlowNode[] {
  return applyLayeredLayout(nodes, edges, { nodeWidth: DEFINITION_NODE_WIDTH, nodeHeight: DEFINITION_NODE_HEIGHT });
}

export function filterNodesByType(
  nodes: FlowNode[],
  edges: FlowEdge[],
  visibleTypes: Set<PipelineGraphNodeType>,
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const filteredNodes = nodes.filter((node) => {
    return node.data.kind === "execution" && visibleTypes.has(node.data.graphNode.nodeType);
  });
  const filteredNodeIds = new Set(filteredNodes.map((node) => node.id));

  const filteredEdges = edges.filter(
    (edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target),
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}

export function filterToNeighbors(
  nodes: FlowNode[],
  edges: Edge[],
  selectedNodeId: string,
): { nodes: FlowNode[]; edges: Edge[] } {
  const neighborIds = new Set<string>([selectedNodeId]);

  for (const edge of edges) {
    if (edge.source === selectedNodeId) neighborIds.add(edge.target);
    if (edge.target === selectedNodeId) neighborIds.add(edge.source);
  }

  const filteredNodes = nodes.filter((node) => neighborIds.has(node.id));
  const filteredEdges = edges.filter(
    (edge) => neighborIds.has(edge.source) && neighborIds.has(edge.target),
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}

export { getNodeColor };
