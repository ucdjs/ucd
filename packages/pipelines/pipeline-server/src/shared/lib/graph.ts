import type {
  ExecutionGraphDetailField,
  ExecutionGraphNodeAction,
  ExecutionGraphView,
  GraphDetailFieldType,
} from "#shared/schemas/graph";
import type {
  PipelineGraph,
  PipelineGraphEdge,
  PipelineGraphNode,
  PipelineGraphNodeType,
} from "@ucdjs/pipelines-graph";

export type PipelineFlowNodeType = `pipeline-${PipelineGraphNodeType}`;

interface GraphNodeVisualConfig {
  bg: string;
  border: string;
  iconBg: string;
  icon: string;
  badgeClassName: string;
}

interface GraphNodeConfig {
  label: string;
  color: string;
  visual: GraphNodeVisualConfig;
}

interface GraphDetailFieldSchema {
  label: string;
  key: string;
  type: GraphDetailFieldType;
  hideIfEmpty?: boolean;
}

interface GraphRouteContext {
  sourceId: string;
  fileId: string;
  pipelineId: string;
}

export const graphNodeTypes: readonly PipelineGraphNodeType[] = ["source", "file", "route", "output"];

export const graphNodeConfig = {
  source: {
    label: "Source",
    color: "#6366f1",
    visual: {
      bg: "#eef2ff",
      border: "#a5b4fc",
      iconBg: "#6366f1",
      icon: "S",
      badgeClassName: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-300",
    },
  },
  file: {
    label: "File",
    color: "#10b981",
    visual: {
      bg: "#ecfdf5",
      border: "#6ee7b7",
      iconBg: "#10b981",
      icon: "F",
      badgeClassName: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
    },
  },
  route: {
    label: "Route",
    color: "#f59e0b",
    visual: {
      bg: "#fffbeb",
      border: "#fcd34d",
      iconBg: "#f59e0b",
      icon: "R",
      badgeClassName: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
    },
  },
  output: {
    label: "Output",
    color: "#0ea5e9",
    visual: {
      bg: "#f0f9ff",
      border: "#7dd3fc",
      iconBg: "#0ea5e9",
      icon: "O",
      badgeClassName: "bg-sky-500/12 text-sky-600 dark:text-sky-300",
    },
  },
} as const satisfies Record<PipelineGraphNodeType, GraphNodeConfig>;

const graphNodeDetailSchema = {
  source: [
    { label: "Node ID", key: "id", type: "text" },
    { label: "Version", key: "version", type: "text" },
  ],
  file: [
    { label: "Node ID", key: "id", type: "text" },
    { label: "Name", key: "file.name", type: "text" },
    { label: "Path", key: "file.path", type: "content" },
    { label: "Directory", key: "file.dir", type: "content" },
    { label: "Extension", key: "file.ext", type: "text" },
    { label: "Version", key: "file.version", type: "text" },
    { label: "File", key: "file", type: "json" },
  ],
  route: [
    { label: "Node ID", key: "id", type: "text" },
    { label: "Route ID", key: "routeId", type: "text" },
  ],
  output: [
    { label: "Node ID", key: "id", type: "text" },
    { label: "Output Index", key: "outputIndex", type: "text" },
    { label: "Output ID", key: "outputId", type: "text", hideIfEmpty: true },
    { label: "Property", key: "property", type: "text", hideIfEmpty: true },
    { label: "Locator", key: "locator", type: "content", hideIfEmpty: true },
  ],
} as const satisfies Record<PipelineGraphNodeType, readonly GraphDetailFieldSchema[]>;

export function getFlowNodeType(type: PipelineGraphNodeType): PipelineFlowNodeType {
  return `pipeline-${type}`;
}

export function getGraphNodeConfig(type: PipelineGraphNodeType) {
  return graphNodeConfig[type];
}

export function getNodeBadgeClassName(type: PipelineGraphNodeType): string {
  return graphNodeConfig[type].visual.badgeClassName;
}

export function getGraphEdgeStyle(edgeType: PipelineGraphEdge["type"]): {
  animated?: boolean;
  style: { strokeWidth: number; stroke?: string };
} {
  const baseStyle = { strokeWidth: 2 };

  switch (edgeType) {
    case "provides":
      return { style: { ...baseStyle, stroke: "#6366f1" } };
    case "matched":
      return { style: { ...baseStyle, stroke: "#22c55e" } };
    case "parsed":
      return { style: { ...baseStyle, stroke: "#f59e0b" } };
    case "resolved":
      return { style: { ...baseStyle, stroke: "#3b82f6" } };
    default:
      return { style: baseStyle };
  }
}

export function buildExecutionGraphView(
  graph: PipelineGraph,
  routeContext: GraphRouteContext,
): ExecutionGraphView {
  return {
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      nodeType: node.type,
      flowType: getFlowNodeType(node.type),
      label: getNodeLabel(node),
      detailFields: getGraphDetailFields(node),
      actions: getGraphNodeActions(node, routeContext),
    })),
    edges: graph.edges.map((edge, index) => ({
      id: `edge-${index}-${edge.from}-${edge.to}`,
      source: edge.from,
      target: edge.to,
      label: edge.type,
      edgeType: edge.type,
    })),
  };
}

function getGraphNodeActions(
  node: PipelineGraphNode,
  routeContext: GraphRouteContext,
): ExecutionGraphNodeAction[] | undefined {
  switch (node.type) {
    case "route":
      return [{
        label: `Open ${node.routeId}`,
        to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect",
        params: {
          sourceId: routeContext.sourceId,
          sourceFileId: routeContext.fileId,
          pipelineId: routeContext.pipelineId,
        },
        search: {
          route: node.routeId,
        },
      }];
    case "output":
      return [{
        label: "Open outputs",
        to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect",
        params: {
          sourceId: routeContext.sourceId,
          sourceFileId: routeContext.fileId,
          pipelineId: routeContext.pipelineId,
        },
        search: {
          view: "outputs",
        },
      }];
    default:
      return undefined;
  }
}

function getGraphDetailFields(node: PipelineGraphNode): ExecutionGraphDetailField[] {
  const fields = graphNodeDetailSchema[node.type] as readonly GraphDetailFieldSchema[];

  return fields.flatMap((field) => {
    const value = getValueByKeyPath(node, field.key);

    if (field.hideIfEmpty && isEmptyValue(value)) {
      return [];
    }

    return [{
      label: field.label,
      type: field.type,
      value: value ?? null,
    }];
  });
}

function getNodeLabel(node: PipelineGraphNode): string {
  switch (node.type) {
    case "source":
      return `v${node.version}`;
    case "file":
      return node.file.name;
    case "route":
      return node.routeId;
    case "output":
      if (node.outputId && node.outputId !== "default") {
        if (node.locator) {
          return `${node.outputId} -> ${getLocatorName(node.locator)}`;
        }
        return node.outputId;
      }
      if (node.locator) {
        return getLocatorName(node.locator);
      }
      return node.property
        ? `Output[${node.outputIndex}].${node.property}`
        : `Output[${node.outputIndex}]`;
  }
}

function getLocatorName(locator: string): string {
  // eslint-disable-next-line e18e/prefer-static-regex
  const normalized = locator.replace(/^memory:\/\//, "");
  const parts = normalized.split("/").filter(Boolean);
  return parts.at(-1) ?? locator;
}

function getValueByKeyPath(value: unknown, keyPath: string): unknown {
  return keyPath.split(".").reduce<unknown>((current, key) => {
    if (current == null || typeof current !== "object") {
      return undefined;
    }

    return key in current ? (current as Record<string, unknown>)[key] : undefined;
  }, value);
}

function isEmptyValue(value: unknown): boolean {
  return value == null || value === "";
}

export function getNodeColor(node: { type?: string }): string {
  if (!node.type?.startsWith("pipeline-")) {
    return "#6b7280";
  }

  const nodeType = node.type.slice("pipeline-".length) as PipelineGraphNodeType;
  return graphNodeConfig[nodeType]?.color ?? "#6b7280";
}

export type { GraphNodeVisualConfig };
export type { GraphNodeConfig };
