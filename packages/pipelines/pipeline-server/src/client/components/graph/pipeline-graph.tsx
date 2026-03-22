import type { FlowEdge, FlowNode } from "#lib/graph-utils";
import type { ExecutionGraphNodeView, ExecutionGraphView } from "#shared/schemas/graph";
import type {
  PipelineGraphNodeType,
} from "@ucdjs/pipelines-core";
import type { EdgeChange, NodeChange, NodeMouseHandler, NodeTypes } from "@xyflow/react";
import { applyExecutionLayout, executionGraphToFlow, filterNodesByType, getNodeColor } from "#lib/graph-utils";
import { getFlowNodeType, graphNodeTypes } from "#shared/lib/graph";
import { cn } from "@ucdjs-internal/shared-ui";
import { applyEdgeChanges, applyNodeChanges, Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PipelineGraphDetails } from "./graph-details";
import { PipelineGraphFilters } from "./graph-filters";
import { PipelineNodeRenderer } from "./nodes";
import "@xyflow/react/dist/style.css";

const defaultVisibleTypes: Set<PipelineGraphNodeType> = new Set(graphNodeTypes);

const fitViewOptions = { padding: 0.2 } as const;
const proOptions = { hideAttribution: true } as const;
const minimapMaskColor = "rgba(0, 0, 0, 0.1)";
const nodeTypes = Object.fromEntries(
  graphNodeTypes.map((type) => [getFlowNodeType(type), PipelineNodeRenderer]),
) as NodeTypes;

export interface PipelineGraphProps {
  graph: ExecutionGraphView;
  onNodeSelect?: (node: ExecutionGraphNodeView | null) => void;
  showFilters?: boolean;
  showDetails?: boolean;
  showMinimap?: boolean;
  className?: string;
}

export function PipelineGraph({
  graph,
  onNodeSelect,
  showFilters = true,
  showDetails = true,
  showMinimap = true,
  className,
}: PipelineGraphProps) {
  // Convert the persisted pipeline graph into React Flow primitives once per graph payload.
  const { allNodes, allEdges } = useMemo(() => {
    const { nodes, edges } = executionGraphToFlow(graph);
    return { allNodes: nodes, allEdges: edges };
  }, [graph]);

  const [visibleTypes, setVisibleTypes] = useState<Set<PipelineGraphNodeType>>(
    () => new Set(defaultVisibleTypes),
  );
  const [selectedNode, setSelectedNode] = useState<ExecutionGraphNodeView | null>(null);

  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes: filteredNodes, edges: filteredEdges } = filterNodesByType(
      allNodes,
      allEdges,
      visibleTypes,
    );
    const positioned = applyExecutionLayout(filteredNodes, filteredEdges);
    return { initialNodes: positioned, initialEdges: filteredEdges };
  }, [allNodes, allEdges, visibleTypes]);

  const [nodes, setNodes] = useState<FlowNode[]>(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  const handleToggleType = useCallback((type: PipelineGraphNodeType) => {
    setVisibleTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) {
        if (next.size > 1) {
          next.delete(type);
        }
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const handleNodeClick: NodeMouseHandler<FlowNode> = useCallback(
    (_event, node) => {
      const selectedGraphNode = node.data.kind === "execution" ? node.data.graphNode : null;
      setSelectedNode(selectedGraphNode);
      onNodeSelect?.(selectedGraphNode);
    },
    [onNodeSelect],
  );

  const handleNodesChange = useCallback((changes: NodeChange<FlowNode>[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const handleEdgesChange = useCallback((changes: EdgeChange<FlowEdge>[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  const handleCloseDetails = useCallback(() => {
    setSelectedNode(null);
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  return (
    <div
      data-testid="pipeline-graph"
      className={cn("pipeline-graph flex h-full w-full overflow-hidden", className)}
    >
      <div
        data-testid="pipeline-graph-flow"
        className="relative flex min-w-0 flex-1 flex-col"
      >
        {showFilters && (
          <div data-testid="pipeline-graph-filters" className="absolute left-3 top-3 z-10">
            <PipelineGraphFilters
              visibleTypes={visibleTypes}
              onToggleType={handleToggleType}
            />
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
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
          {showMinimap && (
            <MiniMap
              nodeColor={getNodeColor}
              maskColor={minimapMaskColor}
            />
          )}
        </ReactFlow>
      </div>

      {showDetails && selectedNode && (
        <PipelineGraphDetails
          node={selectedNode}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}
