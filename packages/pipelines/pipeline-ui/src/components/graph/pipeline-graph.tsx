import type { PipelineFlowNode } from "#lib/adapter";
import type {
  PipelineGraphNode,
  PipelineGraphNodeType,
  PipelineGraph as PipelineGraphType,
} from "@ucdjs/pipelines-core";
import type { NodeMouseHandler, OnNodesChange } from "@xyflow/react";
import type { CSSProperties } from "react";
import { filterNodesByType, pipelineGraphToFlow } from "#lib/adapter";
import { getNodeColor } from "#lib/colors";
import { applyLayout } from "#lib/layout";
import {
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
} from "@xyflow/react";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { PipelineGraphDetails } from "./details";
import { PipelineGraphFilters } from "./filters";
import { nodeTypes } from "./node-types";

import "@xyflow/react/dist/style.css";

const defaultVisibleTypes: Set<PipelineGraphNodeType> = new Set([
  "source",
  "file",
  "route",
  "artifact",
  "output",
]);

const containerStyle: CSSProperties = {
  display: "flex",
  height: "100%",
  width: "100%",
};

const graphContainerStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  position: "relative",
};

const filtersContainerStyle: CSSProperties = {
  position: "absolute",
  top: "12px",
  left: "12px",
  zIndex: 10,
};

const fitViewOptions = { padding: 0.2 } as const;
const proOptions = { hideAttribution: true } as const;
const minimapMaskColor = "rgba(0, 0, 0, 0.1)";

export interface PipelineGraphProps {
  graph: PipelineGraphType;
  onNodeSelect?: (node: PipelineGraphNode | null) => void;
  showFilters?: boolean;
  showDetails?: boolean;
  showMinimap?: boolean;
  className?: string;
}

export const PipelineGraph = memo(({
  graph,
  onNodeSelect,
  showFilters = true,
  showDetails = true,
  showMinimap = true,
  className,
}: PipelineGraphProps) => {
  const { allNodes, allEdges } = useMemo(() => {
    const { nodes, edges } = pipelineGraphToFlow(graph);
    return { allNodes: nodes, allEdges: edges };
  }, [graph]);

  const [visibleTypes, setVisibleTypes] = useState<Set<PipelineGraphNodeType>>(
    () => new Set(defaultVisibleTypes),
  );

  const [selectedNode, setSelectedNode] = useState<PipelineGraphNode | null>(null);

  const { layoutedNodes, layoutedEdges } = useMemo(() => {
    const { nodes: filteredNodes, edges: filteredEdges } = filterNodesByType(
      allNodes,
      allEdges,
      visibleTypes,
    );
    const positioned = applyLayout(filteredNodes, filteredEdges);
    return { layoutedNodes: positioned, layoutedEdges: filteredEdges };
  }, [allNodes, allEdges, visibleTypes]);

  const [nodes, setNodes] = useState<PipelineFlowNode[]>([]);

  const layoutKeyRef = useRef<string>("");

  const currentLayoutKey = layoutedNodes.map((n) => n.id).join(",");
  if (currentLayoutKey !== layoutKeyRef.current) {
    layoutKeyRef.current = currentLayoutKey;
    setNodes(layoutedNodes);
  }

  const onNodesChange: OnNodesChange<PipelineFlowNode> = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const isDraggingRef = useRef(false);

  const handleToggleType = useCallback((type: PipelineGraphNodeType) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
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

  const handleNodeDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleNodeDragStop = useCallback(() => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 0);
  }, []);

  const handleNodeClick: NodeMouseHandler<PipelineFlowNode> = useCallback(
    (_event, node) => {
      if (isDraggingRef.current) {
        return;
      }
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
    <div style={containerStyle} className={className}>
      <div style={graphContainerStyle}>
        {showFilters && (
          <div style={filtersContainerStyle}>
            <PipelineGraphFilters
              visibleTypes={visibleTypes}
              onToggleType={handleToggleType}
            />
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={layoutedEdges}
          onNodesChange={onNodesChange}
          onNodeClick={handleNodeClick}
          onNodeDragStart={handleNodeDragStart}
          onNodeDragStop={handleNodeDragStop}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={fitViewOptions}
          minZoom={0.1}
          maxZoom={2}
          proOptions={proOptions}
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
});
