import type {
  PipelineGraphNode,
  PipelineGraphNodeType,
  PipelineGraph as PipelineGraphType,
} from "@ucdjs/pipelines-core";
import type { NodeMouseHandler } from "@xyflow/react";
import type { PipelineFlowNode } from "./graph-utils";
import { cn } from "@ucdjs-internal/shared-ui";
import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import { PipelineGraphDetails } from "./graph-details";
import { PipelineGraphFilters } from "./graph-filters";
import { applyLayout, filterNodesByType, getNodeColor, pipelineGraphToFlow } from "./graph-utils";
import { ArtifactNode, FileNode, OutputNode, RouteNode, SourceNode } from "./nodes";
import "@xyflow/react/dist/style.css";

const defaultVisibleTypes: Set<PipelineGraphNodeType> = new Set([
  "source",
  "file",
  "route",
  "artifact",
  "output",
]);

const fitViewOptions = { padding: 0.2 } as const;
const proOptions = { hideAttribution: true } as const;
const minimapMaskColor = "rgba(0, 0, 0, 0.1)";
const nodeTypes = {
  "pipeline-source": SourceNode,
  "pipeline-file": FileNode,
  "pipeline-route": RouteNode,
  "pipeline-artifact": ArtifactNode,
  "pipeline-output": OutputNode,
} as const;

export interface PipelineGraphProps {
  graph: PipelineGraphType;
  onNodeSelect?: (node: PipelineGraphNode | null) => void;
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
    const { nodes, edges } = pipelineGraphToFlow(graph);
    return { allNodes: nodes, allEdges: edges };
  }, [graph]);

  const [visibleTypes, setVisibleTypes] = useState<Set<PipelineGraphNodeType>>(
    () => new Set(defaultVisibleTypes),
  );
  const [selectedNode, setSelectedNode] = useState<PipelineGraphNode | null>(null);

  // Filtering and layout happen together so React Flow always receives a coherent visible slice.
  const { layoutedNodes, layoutedEdges } = useMemo(() => {
    const { nodes: filteredNodes, edges: filteredEdges } = filterNodesByType(
      allNodes,
      allEdges,
      visibleTypes,
    );
    const positioned = applyLayout(filteredNodes, filteredEdges);
    return { layoutedNodes: positioned, layoutedEdges: filteredEdges };
  }, [allNodes, allEdges, visibleTypes]);

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

  const handleNodeClick: NodeMouseHandler<PipelineFlowNode> = useCallback(
    (_event, node) => {
      const pipelineNode = node.data?.pipelineNode ?? null;
      setSelectedNode(pipelineNode);
      onNodeSelect?.(pipelineNode);
    },
    [onNodeSelect],
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  const handleCloseDetails = useCallback(() => {
    setSelectedNode(null);
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  return (
    <div className={cn("pipeline-graph flex h-full w-full overflow-hidden", className)}>
      <div className="relative flex min-w-0 flex-1 flex-col">
        {showFilters && (
          <div className="absolute left-3 top-3 z-10">
            <PipelineGraphFilters
              visibleTypes={visibleTypes}
              onToggleType={handleToggleType}
            />
          </div>
        )}

        <ReactFlow
          nodes={layoutedNodes}
          edges={layoutedEdges}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={fitViewOptions}
          minZoom={0.1}
          maxZoom={2}
          proOptions={proOptions}
          nodesDraggable={false}
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
