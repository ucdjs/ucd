import type { PipelineGraphNode } from "@ucdjs/pipelines-core";
import type { NodeProps } from "@xyflow/react";
import type { CSSProperties } from "react";
import { Handle, Position } from "@xyflow/react";
import { memo } from "react";

export interface PipelineNodeData {
  pipelineNode: PipelineGraphNode;
  label: string;
}

interface NodeTypeStyle {
  bg: string;
  border: string;
  iconBg: string;
  icon: string;
}

// Hoisted outside component - these never change
const nodeTypeStyles: Record<string, NodeTypeStyle> = {
  source: {
    bg: "#eef2ff",
    border: "#a5b4fc",
    iconBg: "#6366f1",
    icon: "S",
  },
  file: {
    bg: "#ecfdf5",
    border: "#6ee7b7",
    iconBg: "#10b981",
    icon: "F",
  },
  route: {
    bg: "#fffbeb",
    border: "#fcd34d",
    iconBg: "#f59e0b",
    icon: "R",
  },
  artifact: {
    bg: "#f5f3ff",
    border: "#c4b5fd",
    iconBg: "#8b5cf6",
    icon: "A",
  },
  output: {
    bg: "#f0f9ff",
    border: "#7dd3fc",
    iconBg: "#0ea5e9",
    icon: "O",
  },
};

const defaultStyle: NodeTypeStyle = {
  bg: "#f9fafb",
  border: "#d1d5db",
  iconBg: "#6b7280",
  icon: "?",
};

// Hoisted static styles - reused across all nodes
const flexCenterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const labelContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  marginLeft: "10px",
};

const typeStyle: CSSProperties = {
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#6b7280",
  marginBottom: "1px",
};

const labelStyle: CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  color: "#111827",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

// Cache for computed styles to avoid recreation
const containerStyleCache = new Map<string, CSSProperties>();
const iconStyleCache = new Map<string, CSSProperties>();
const handleStyleCache = new Map<string, CSSProperties>();

function getContainerStyle(styles: NodeTypeStyle, selected: boolean): CSSProperties {
  const key = `${styles.bg}-${styles.border}-${selected}`;
  let cached = containerStyleCache.get(key);
  if (!cached) {
    cached = {
      backgroundColor: styles.bg,
      border: `2px solid ${styles.border}`,
      borderRadius: "10px",
      padding: "10px 14px",
      minWidth: "150px",
      maxWidth: "220px",
      boxShadow: selected
        ? `0 0 0 2px #3b82f6, 0 1px 3px rgba(0,0,0,0.1)`
        : "0 1px 3px rgba(0,0,0,0.1)",
      transition: "box-shadow 0.15s ease",
      fontFamily: "system-ui, -apple-system, sans-serif",
    };
    containerStyleCache.set(key, cached);
  }
  return cached;
}

function getIconStyle(iconBg: string): CSSProperties {
  let cached = iconStyleCache.get(iconBg);
  if (!cached) {
    cached = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "28px",
      height: "28px",
      borderRadius: "6px",
      backgroundColor: iconBg,
      color: "#ffffff",
      fontSize: "12px",
      fontWeight: 700,
      flexShrink: 0,
    };
    iconStyleCache.set(iconBg, cached);
  }
  return cached;
}

function getHandleStyle(border: string): CSSProperties {
  let cached = handleStyleCache.get(border);
  if (!cached) {
    cached = {
      width: "8px",
      height: "8px",
      backgroundColor: border,
      border: "none",
    };
    handleStyleCache.set(border, cached);
  }
  return cached;
}

// Base node component - memoized to prevent re-renders when parent updates
const BaseNode = memo(({
  data,
  selected = false,
  type,
}: NodeProps & { data: PipelineNodeData; type: string }) => {
  const styles = nodeTypeStyles[type] ?? defaultStyle;

  return (
    <div style={getContainerStyle(styles, selected)}>
      <Handle
        type="target"
        position={Position.Left}
        style={getHandleStyle(styles.border)}
      />

      <div style={flexCenterStyle}>
        <span style={getIconStyle(styles.iconBg)}>
          {styles.icon}
        </span>
        <div style={labelContainerStyle}>
          <span style={typeStyle}>
            {type}
          </span>
          <span style={labelStyle} title={data.label}>
            {data.label}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={getHandleStyle(styles.border)}
      />
    </div>
  );
});

// Individual node type components - memoized
export const SourceNode = memo((props: NodeProps & { data: PipelineNodeData }) => {
  return <BaseNode {...props} type="source" />;
});

export const FileNode = memo((props: NodeProps & { data: PipelineNodeData }) => {
  return <BaseNode {...props} type="file" />;
});

export const RouteNode = memo((props: NodeProps & { data: PipelineNodeData }) => {
  return <BaseNode {...props} type="route" />;
});

export const ArtifactNode = memo((props: NodeProps & { data: PipelineNodeData }) => {
  return <BaseNode {...props} type="artifact" />;
});

export const OutputNode = memo((props: NodeProps & { data: PipelineNodeData }) => {
  return <BaseNode {...props} type="output" />;
});
