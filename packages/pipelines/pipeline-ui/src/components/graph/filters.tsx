import type { PipelineGraphNodeType } from "@ucdjs/pipelines-core";
import type { CSSProperties } from "react";
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

const containerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 12px",
  backgroundColor: "#ffffff",
  borderRadius: "10px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
  fontFamily: "system-ui, -apple-system, sans-serif",
  border: "1px solid #e5e7eb",
};

const labelStyle: CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "#6b7280",
  marginRight: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const buttonStyleCache = new Map<string, CSSProperties>();
const dotStyleCache = new Map<string, CSSProperties>();

function getButtonStyle(color: string, isVisible: boolean): CSSProperties {
  const key = `${color}-${isVisible}`;
  let cached = buttonStyleCache.get(key);
  if (!cached) {
    cached = {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 10px",
      fontSize: "12px",
      fontWeight: 500,
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
      transition: "all 0.15s ease",
      backgroundColor: isVisible ? `${color}15` : "#f3f4f6",
      color: isVisible ? color : "#9ca3af",
      opacity: isVisible ? 1 : 0.6,
    };
    buttonStyleCache.set(key, cached);
  }
  return cached;
}

function getDotStyle(color: string, isVisible: boolean): CSSProperties {
  const key = `${color}-${isVisible}`;
  let cached = dotStyleCache.get(key);
  if (!cached) {
    cached = {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      backgroundColor: color,
      opacity: isVisible ? 1 : 0.3,
      transition: "opacity 0.15s ease",
    };
    dotStyleCache.set(key, cached);
  }
  return cached;
}

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
      style={getButtonStyle(config.color, isVisible)}
      title={isVisible ? `Hide ${config.label} nodes` : `Show ${config.label} nodes`}
    >
      <span style={getDotStyle(config.color, isVisible)} />
      {config.label}
    </button>
  );
});

export function PipelineGraphFilters({
  visibleTypes,
  onToggleType,
}: PipelineGraphFiltersProps) {
  return (
    <div style={containerStyle}>
      <span style={labelStyle}>Show:</span>
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
