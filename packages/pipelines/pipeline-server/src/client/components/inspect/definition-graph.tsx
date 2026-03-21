import type { PipelineDetails } from "#shared/schemas/pipeline";
import type { EdgeChange, NodeChange, NodeMouseHandler, NodeTypes } from "@xyflow/react";
import type { DefinitionFlowNode } from "./definition-graph-utils";
import { cn } from "@ucdjs-internal/shared-ui";
import { applyEdgeChanges, applyNodeChanges, Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { applyDefinitionLayout, filterToNeighbors, pipelineDefinitionToFlow } from "./definition-graph-utils";
import { DefinitionRouteNodeRenderer } from "./definition-node";
import "@xyflow/react/dist/style.css";

const nodeTypes: NodeTypes = {
  "definition-route": DefinitionRouteNodeRenderer,
};

const fitViewOptions = { padding: 0.2 } as const;
const proOptions = { hideAttribution: true } as const;
const minimapMaskColor = "rgba(0, 0, 0, 0.1)";

export interface DefinitionGraphProps {
  pipeline: PipelineDetails;
  selectedRouteId?: string;
  onRouteSelect: (routeId: string) => void;
  mode?: "full" | "neighbors";
  className?: string;
}

export function DefinitionGraph({
  pipeline,
  selectedRouteId,
  onRouteSelect,
  mode = "full",
  className,
}: DefinitionGraphProps) {
  const { allNodes, allEdges } = useMemo(() => {
    const { nodes, edges } = pipelineDefinitionToFlow(pipeline);
    return { allNodes: nodes, allEdges: edges };
  }, [pipeline]);

  const { initialNodes, initialEdges } = useMemo(() => {
    let layoutNodes = allNodes;
    let layoutEdges = allEdges;

    if (mode === "neighbors" && selectedRouteId) {
      const filtered = filterToNeighbors(allNodes, allEdges, selectedRouteId);
      layoutNodes = filtered.nodes;
      layoutEdges = filtered.edges;
    }

    const positioned = applyDefinitionLayout(layoutNodes, layoutEdges);
    return { initialNodes: positioned, initialEdges: layoutEdges };
  }, [allNodes, allEdges, mode, selectedRouteId]);

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  const handleNodeClick: NodeMouseHandler<DefinitionFlowNode> = useCallback(
    (_event, node) => {
      onRouteSelect(node.data.routeId);
    },
    [onRouteSelect],
  );

  const handleNodesChange = useCallback((changes: NodeChange<DefinitionFlowNode>[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
  }, []);

  const dimmedNodeIds = useMemo(() => {
    if (mode !== "full" || !selectedRouteId) return new Set<string>();

    const neighborIds = new Set<string>([selectedRouteId]);
    for (const edge of allEdges) {
      if (edge.source === selectedRouteId) neighborIds.add(edge.target);
      if (edge.target === selectedRouteId) neighborIds.add(edge.source);
    }

    return new Set(allNodes.filter((n) => !neighborIds.has(n.id)).map((n) => n.id));
  }, [mode, selectedRouteId, allNodes, allEdges]);

  const styledNodes = useMemo(() => {
    if (dimmedNodeIds.size === 0 && !selectedRouteId) return nodes;

    return nodes.map((node) => ({
      ...node,
      selected: node.id === selectedRouteId,
      style: dimmedNodeIds.has(node.id) ? { opacity: 0.35 } : undefined,
    }));
  }, [nodes, dimmedNodeIds, selectedRouteId]);

  return (
    <div className={cn("h-full w-full", className)}>
      <ReactFlow
        nodes={styledNodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={fitViewOptions}
        minZoom={0.1}
        maxZoom={2}
        proOptions={proOptions}
        nodesDraggable
        nodesConnectable={false}
        className="bg-transparent"
      >
        <Background />
        <Controls />
        {mode === "full" && (
          <MiniMap maskColor={minimapMaskColor} />
        )}
      </ReactFlow>
    </div>
  );
}
