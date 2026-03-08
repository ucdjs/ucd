import type {
  PipelineGraphNode,
  PipelineGraphNodeType,
  PipelineGraph as PipelineGraphType,
} from "@ucdjs/pipelines-core";
import type { NodeMouseHandler } from "@xyflow/react";
import type { PipelineFlowNode } from "./graph-utils";
import { cn } from "@ucdjs-internal/shared-ui";
import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import { X } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
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
const allNodeTypes: readonly PipelineGraphNodeType[] = ["source", "file", "route", "artifact", "output"] as const;
const nodeTypeLabels: Record<PipelineGraphNodeType, { label: string; color: string }> = {
  source: { label: "Source", color: "#6366f1" },
  file: { label: "File", color: "#10b981" },
  route: { label: "Route", color: "#f59e0b" },
  artifact: { label: "Artifact", color: "#8b5cf6" },
  output: { label: "Output", color: "#0ea5e9" },
};
const nodeTypes = {
  source: SourceNode,
  file: FileNode,
  route: RouteNode,
  artifact: ArtifactNode,
  output: OutputNode,
} as const;

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-background/70 p-3">
      <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
        {label}
      </span>
      <span className="break-all font-mono text-sm text-foreground">{value}</span>
    </div>
  );
}

function NodeDetails({ node }: { node: PipelineGraphNode }) {
  switch (node.type) {
    case "source":
      return <DetailRow label="Version" value={node.version} />;
    case "file":
      return (
        <>
          <DetailRow label="Name" value={node.file.name} />
          <DetailRow label="Path" value={node.file.path} />
          <DetailRow label="Directory" value={node.file.dir} />
          <DetailRow label="Extension" value={node.file.ext} />
          <DetailRow label="Version" value={node.file.version} />
        </>
      );
    case "route":
      return <DetailRow label="Route ID" value={node.routeId} />;
    case "artifact":
      return <DetailRow label="Artifact ID" value={node.artifactId} />;
    case "output":
      return (
        <>
          <DetailRow label="Output Index" value={String(node.outputIndex)} />
          {node.property && <DetailRow label="Property" value={node.property} />}
        </>
      );
  }
}

function getBadgeClassName(type: string) {
  switch (type) {
    case "source":
      return "bg-indigo-500/12 text-indigo-600 dark:text-indigo-300";
    case "file":
      return "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300";
    case "route":
      return "bg-amber-500/12 text-amber-700 dark:text-amber-300";
    case "artifact":
      return "bg-violet-500/12 text-violet-600 dark:text-violet-300";
    case "output":
      return "bg-sky-500/12 text-sky-600 dark:text-sky-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function PipelineGraphDetails({
  node,
  onClose,
}: {
  node: PipelineGraphNode | null;
  onClose: () => void;
}) {
  if (!node) {
    return null;
  }

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-card/95 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className={cn("rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.05em]", getBadgeClassName(node.type))}>
          {node.type}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          <DetailRow label="Node ID" value={node.id} />
          <NodeDetails node={node} />
        </div>
      </div>
    </div>
  );
}

function PipelineGraphFilters({
  visibleTypes,
  onToggleType,
}: {
  visibleTypes: Set<PipelineGraphNodeType>;
  onToggleType: (type: PipelineGraphNodeType) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card/95 p-3 shadow-lg backdrop-blur-sm">
      <span className="mr-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Show
      </span>
      {allNodeTypes.map((type) => {
        const isVisible = visibleTypes.has(type);
        const config = nodeTypeLabels[type];

        return (
          <button
            key={type}
            type="button"
            onClick={() => onToggleType(type)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
              isVisible
                ? "border-border bg-card text-foreground shadow-sm"
                : "border-border/50 bg-muted/40 text-muted-foreground",
            )}
            title={isVisible ? `Hide ${config.label} nodes` : `Show ${config.label} nodes`}
          >
            <span
              className={cn("h-2 w-2 rounded-full transition-opacity", !isVisible && "opacity-35")}
              style={{ backgroundColor: config.color }}
            />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}

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
});
