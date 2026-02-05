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

// Hoisted outside component - stable references
const defaultVisibleTypes: Set<PipelineGraphNodeType> = new Set([
  "source",
  "file",
  "route",
  "artifact",
  "output",
]);

// Hoisted static styles
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

// Hoisted fitView options - stable reference
const fitViewOptions = { padding: 0.2 } as const;

// Hoisted proOptions - stable reference
const proOptions = { hideAttribution: true } as const;

// Hoisted minimap mask color
const minimapMaskColor = "rgba(0, 0, 0, 0.1)";

export interface PipelineGraphProps {
  /** The pipeline graph to visualize */
  graph: PipelineGraphType;
  /** Callback when a node is selected/deselected */
  onNodeSelect?: (node: PipelineGraphNode | null) => void;
  /** Show the filter toolbar (default: true) */
  showFilters?: boolean;
  /** Show the details panel (default: true) */
  showDetails?: boolean;
  /** Show the minimap (default: true) */
  showMinimap?: boolean;
  /** Additional className for the container */
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
  // Convert pipeline graph to React Flow format - memoized
  const { allNodes, allEdges } = useMemo(() => {
    const { nodes, edges } = pipelineGraphToFlow(graph);
    return { allNodes: nodes, allEdges: edges };
  }, [graph]);

  // Filter state - use lazy initializer for Set
  const [visibleTypes, setVisibleTypes] = useState<Set<PipelineGraphNodeType>>(
    () => new Set(defaultVisibleTypes),
  );

  // Selected node state
  const [selectedNode, setSelectedNode] = useState<PipelineGraphNode | null>(null);

  // Apply filtering and layout - memoized
  const { layoutedNodes, layoutedEdges } = useMemo(() => {
    const { nodes: filteredNodes, edges: filteredEdges } = filterNodesByType(
      allNodes,
      allEdges,
      visibleTypes,
    );
    const positioned = applyLayout(filteredNodes, filteredEdges);
    return { layoutedNodes: positioned, layoutedEdges: filteredEdges };
  }, [allNodes, allEdges, visibleTypes]);

  // Maintain actual node state for React Flow
  // Initialize from layouted nodes and update when they change
  const [nodes, setNodes] = useState<PipelineFlowNode[]>([]);

  // Track which layout we've synced to avoid unnecessary updates
  const layoutKeyRef = useRef<string>("");

  // Sync nodes when layout changes (e.g., filter changes)
  // We use a key based on node IDs to detect layout changes
  const currentLayoutKey = layoutedNodes.map((n) => n.id).join(",");
  if (currentLayoutKey !== layoutKeyRef.current) {
    layoutKeyRef.current = currentLayoutKey;
    setNodes(layoutedNodes);
  }

  // Handle node changes (for drag operations and initialization)
  const onNodesChange: OnNodesChange<PipelineFlowNode> = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  // Track if we're currently dragging to prevent showing details on drag
  const isDraggingRef = useRef(false);

  // Handle filter toggle - uses functional setState for stable callback
  const handleToggleType = useCallback((type: PipelineGraphNodeType) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        // Don't allow hiding all types
        if (next.size > 1) {
          next.delete(type);
        }
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // Handle node drag start - mark as dragging
  const handleNodeDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  // Handle node drag stop - reset dragging flag after a short delay
  // The delay ensures the click handler sees the dragging state
  const handleNodeDragStop = useCallback(() => {
    // Use setTimeout to reset after click event has fired
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 0);
  }, []);

  // Handle node click - only show details if not dragging
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

  // Handle pane click - deselect node when clicking empty area
  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  // Handle close details - stable callback
  const handleCloseDetails = useCallback(() => {
    setSelectedNode(null);
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  return (
    <div style={containerStyle} className={className}>
      <div style={graphContainerStyle}>
        {/* Filters toolbar */}
        {showFilters && (
          <div style={filtersContainerStyle}>
            <PipelineGraphFilters
              visibleTypes={visibleTypes}
              onToggleType={handleToggleType}
            />
          </div>
        )}

        {/* Main graph */}
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

      {/* Details panel */}
      {showDetails && selectedNode && (
        <PipelineGraphDetails
          node={selectedNode}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
});
