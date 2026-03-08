import type { PipelineGraphNodeType } from "@ucdjs/pipelines-core";
import { cn } from "#lib/utils";
import { memo, useCallback } from "react";

interface NodeTypeConfig {
  label: string;
  color: string;
}

const nodeTypeLabels: Record<PipelineGraphNodeType, NodeTypeConfig> = {
  source: { label: "Source", color: "#6366f1" },
  file: { label: "File", color: "#10b981" },
  route: { label: "Route", color: "#f59e0b" },
  artifact: { label: "Artifact", color: "#8b5cf6" },
  output: { label: "Output", color: "#0ea5e9" },
};

const allNodeTypes: readonly PipelineGraphNodeType[] = ["source", "file", "route", "artifact", "output"] as const;

export interface PipelineGraphFiltersProps {
  visibleTypes: Set<PipelineGraphNodeType>;
  onToggleType: (type: PipelineGraphNodeType) => void;
}

interface FilterButtonProps {
  type: PipelineGraphNodeType;
  config: NodeTypeConfig;
  isVisible: boolean;
  onToggle: (type: PipelineGraphNodeType) => void;
}

const FilterButton = memo(({
  type,
  config,
  isVisible,
  onToggle,
}: FilterButtonProps) => {
  const handleClick = useCallback(() => {
    onToggle(type);
  }, [onToggle, type]);

  return (
    <button
      type="button"
      onClick={handleClick}
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
});

export function PipelineGraphFilters({
  visibleTypes,
  onToggleType,
}: PipelineGraphFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card/95 p-3 shadow-lg backdrop-blur-sm">
      <span className="mr-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Show
      </span>
      {allNodeTypes.map((type) => (
        <FilterButton
          key={type}
          type={type}
          config={nodeTypeLabels[type]}
          isVisible={visibleTypes.has(type)}
          onToggle={onToggleType}
        />
      ))}
    </div>
  );
}
