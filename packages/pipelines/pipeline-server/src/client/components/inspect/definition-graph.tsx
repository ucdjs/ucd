import type { FlowNode, FlowNodeData } from "#lib/graph-utils";
import type { PipelineDetails } from "#shared/schemas/pipeline";
import type { EdgeChange, NodeChange, NodeMouseHandler, NodeTypes } from "@xyflow/react";
import { applyDefinitionLayout, definitionGraphToFlow, filterToNeighbors } from "#lib/graph-utils";
import { cn } from "@ucdjs-internal/shared-ui";
import { applyEdgeChanges, applyNodeChanges, Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import { useEffect, useState } from "react";
import { DefinitionOutputNodeRenderer, DefinitionRouteNodeRenderer } from "./definition-node";
import "@xyflow/react/dist/style.css";

const nodeTypes: NodeTypes = {
  "definition-route": DefinitionRouteNodeRenderer,
  "definition-output": DefinitionOutputNodeRenderer,
};

const fitViewOptions = { padding: 0.2 } as const;
const proOptions = { hideAttribution: true } as const;
const minimapMaskColor = "rgba(0, 0, 0, 0.1)";

export interface DefinitionGraphProps {
  pipeline: PipelineDetails;
  selectedRouteId?: string;
  onRouteSelect: (routeId: string) => void;
  onOutputSelect?: (outputKey: string) => void;
  includeOutputs?: boolean;
  mode?: "full" | "neighbors";
  className?: string;
}

export function DefinitionGraph({
  pipeline,
  selectedRouteId,
  onRouteSelect,
  onOutputSelect,
  includeOutputs = false,
  mode = "full",
  className,
}: DefinitionGraphProps) {
  const { allNodes, allEdges } = (() => {
    const { nodes, edges } = definitionGraphToFlow(pipeline, { includeOutputs });
    return { allNodes: nodes, allEdges: edges };
  })();

  const { initialNodes, initialEdges } = (() => {
    let layoutNodes = allNodes;
    let layoutEdges = allEdges;

    if (mode === "neighbors" && selectedRouteId) {
      const filtered = filterToNeighbors(allNodes, allEdges, selectedRouteId);
      layoutNodes = filtered.nodes;
      layoutEdges = filtered.edges;
    }

    const positioned = applyDefinitionLayout(layoutNodes, layoutEdges);
    return { initialNodes: positioned, initialEdges: layoutEdges };
  })();

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  // XYFlow requires mutable state for drag interactions (applyNodeChanges/applyEdgeChanges),
  // so we can't use initialNodes/initialEdges directly. This effect syncs the computed layout
  // back into state when the graph data, mode, or selection changes.
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    setNodes(initialNodes);
    // eslint-disable-next-line react/set-state-in-effect
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  const handleNodeClick: NodeMouseHandler<FlowNode> = (_event, node) => {
    const data = node.data as FlowNodeData;
    if (data.kind === "definition-output") {
      onOutputSelect?.(data.outputKey);
    } else if (data.kind === "definition-route") {
      onRouteSelect(data.routeId);
    }
  };

  const handleNodesChange = (changes: NodeChange<FlowNode>[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  };

  const handleEdgesChange = (changes: EdgeChange[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
  };

  const dimmedNodeIds = (() => {
    if (mode !== "full" || !selectedRouteId) return new Set<string>();

    const neighborIds = new Set<string>([selectedRouteId]);
    for (const edge of allEdges) {
      if (edge.source === selectedRouteId) neighborIds.add(edge.target);
      if (edge.target === selectedRouteId) neighborIds.add(edge.source);
    }

    return new Set(allNodes.filter((n) => !neighborIds.has(n.id)).map((n) => n.id));
  })();

  const styledNodes = (() => {
    if (dimmedNodeIds.size === 0 && !selectedRouteId) return nodes;

    return nodes.map((node) => ({
      ...node,
      selected: node.id === selectedRouteId,
      style: dimmedNodeIds.has(node.id) ? { opacity: 0.35 } : undefined,
    }));
  })();

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
