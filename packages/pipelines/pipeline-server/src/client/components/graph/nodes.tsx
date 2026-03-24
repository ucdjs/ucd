import type { ExecutionNodeData, FlowNode } from "#lib/graph-utils";
import type { NodeProps } from "@xyflow/react";
import type { CSSProperties } from "react";
import { EXECUTION_NODE_HEIGHT, EXECUTION_NODE_WIDTH } from "#lib/graph-utils";
import { getGraphNodeConfig } from "#shared/lib/graph";
import { Handle, Position } from "@xyflow/react";
import { memo } from "react";

// Shared style fragments keep node rendering cheap because React Flow mounts many nodes.
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

// Cache computed styles by visual variant so node renders don't allocate fresh objects.
const containerStyleCache = new Map<string, CSSProperties>();
const iconStyleCache = new Map<string, CSSProperties>();
const handleStyleCache = new Map<string, CSSProperties>();

function getContainerStyle(
  styles: ReturnType<typeof getGraphNodeConfig>["visual"],
  selected: boolean,
): CSSProperties {
  const key = `${styles.bg}-${styles.border}-${selected}`;
  let cached = containerStyleCache.get(key);
  if (!cached) {
    cached = {
      backgroundColor: styles.bg,
      border: `2px solid ${styles.border}`,
      borderRadius: "10px",
      padding: "10px 14px",
      width: `${EXECUTION_NODE_WIDTH}px`,
      minHeight: `${EXECUTION_NODE_HEIGHT}px`,
      boxSizing: "border-box",
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

function BaseNode({
  data,
  selected = false,
}: NodeProps<FlowNode>) {
  const { graphNode } = data as ExecutionNodeData;
  const nodeConfig = getGraphNodeConfig(graphNode.nodeType);
  const { visual } = nodeConfig;

  return (
    <div
      style={getContainerStyle(visual, selected)}
      data-node-id={graphNode.id}
      data-node-type={graphNode.nodeType}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={getHandleStyle(visual.border)}
      />

      <div style={flexCenterStyle}>
        <span style={getIconStyle(visual.iconBg)}>
          {visual.icon}
        </span>
        <div style={labelContainerStyle}>
          <span style={typeStyle}>
            {nodeConfig.label}
          </span>
          <span style={labelStyle} title={graphNode.label}>
            {graphNode.label}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={getHandleStyle(visual.border)}
      />
    </div>
  );
}

export const PipelineNodeRenderer = memo(BaseNode);
