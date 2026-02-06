import type { PipelineGraphNode } from "@ucdjs/pipelines-core";
import type { CSSProperties } from "react";

export interface PipelineGraphDetailsProps {
  node: PipelineGraphNode | null;
  onClose: () => void;
}

const containerStyle: CSSProperties = {
  width: "280px",
  backgroundColor: "#ffffff",
  borderLeft: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  boxShadow: "-2px 0 8px rgba(0,0,0,0.05)",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
};

const closeButtonStyle: CSSProperties = {
  padding: "4px",
  color: "#9ca3af",
  background: "none",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const contentStyle: CSSProperties = {
  flex: 1,
  padding: "12px",
  overflowY: "auto",
};

const detailsContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const detailRowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const detailLabelStyle: CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.025em",
};

const detailValueStyle: CSSProperties = {
  fontSize: "13px",
  color: "#111827",
  fontFamily: "ui-monospace, monospace",
  wordBreak: "break-all",
};

const badgeStyleCache = new Map<string, CSSProperties>();

function getBadgeStyle(type: string): CSSProperties {
  let cached = badgeStyleCache.get(type);
  if (!cached) {
    const colors: Record<string, { bg: string; color: string }> = {
      source: { bg: "#eef2ff", color: "#4f46e5" },
      file: { bg: "#ecfdf5", color: "#059669" },
      route: { bg: "#fffbeb", color: "#d97706" },
      artifact: { bg: "#f5f3ff", color: "#7c3aed" },
      output: { bg: "#f0f9ff", color: "#0284c7" },
    };
    const c = colors[type] ?? { bg: "#f3f4f6", color: "#6b7280" };
    cached = {
      padding: "2px 8px",
      fontSize: "11px",
      fontWeight: 600,
      borderRadius: "4px",
      textTransform: "uppercase",
      letterSpacing: "0.025em",
      backgroundColor: c.bg,
      color: c.color,
    };
    badgeStyleCache.set(type, cached);
  }
  return cached;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={detailRowStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <span style={detailValueStyle}>{value}</span>
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

const closeIcon = (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export function PipelineGraphDetails({
  node,
  onClose,
}: PipelineGraphDetailsProps) {
  if (!node) {
    return null;
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={getBadgeStyle(node.type)}>
          {node.type}
        </span>
        <button
          type="button"
          onClick={onClose}
          style={closeButtonStyle}
          aria-label="Close details"
        >
          {closeIcon}
        </button>
      </div>

      <div style={contentStyle}>
        <div style={detailsContainerStyle}>
          <DetailRow label="Node ID" value={node.id} />
          <NodeDetails node={node} />
        </div>
      </div>
    </div>
  );
}
