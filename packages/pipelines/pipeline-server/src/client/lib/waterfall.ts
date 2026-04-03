import type { ExecutionSpanItem } from "#shared/schemas/execution";

export interface WaterfallNode {
  id: string;
  kind: string;
  name: string;
  traceId: string | null;
  spanId: string | null;
  parentSpanId: string | null;
  startMs: number; // relative to traceStartMs
  durationMs: number; // 0 for instant events
  isInstant: boolean;
  hasError: boolean;
  depth: number;
  hasChildren: boolean;
  children: WaterfallNode[];
  raw: ExecutionSpanItem;
}

export interface ViewRange {
  start: number; // 0..1 fraction of total duration
  end: number; // 0..1 fraction of total duration
}

export interface RowState {
  node: WaterfallNode;
  isHidden: boolean;
}

export function buildWaterfallTree(spans: ExecutionSpanItem[], traceId: string | null): {
  roots: WaterfallNode[];
  allNodes: WaterfallNode[];
  totalDurationMs: number;
  traceStartMs: number;
} {
  if (spans.length === 0) {
    return { roots: [], allNodes: [], totalDurationMs: 0, traceStartMs: 0 };
  }

  // traceStartMs = min startTimestamp across all spans
  let traceStartMs = Infinity;
  for (const span of spans) {
    if (span.startTimestamp != null && span.startTimestamp < traceStartMs) {
      traceStartMs = span.startTimestamp;
    }
  }
  if (!Number.isFinite(traceStartMs)) {
    traceStartMs = 0;
  }

  // Build node map -all items are spans with their own unique spanId
  const nodeMap = new Map<string, WaterfallNode>();
  for (const span of spans) {
    const isInstant = span.startTimestamp == null || span.durationMs == null;
    const startMs = span.startTimestamp != null ? span.startTimestamp - traceStartMs : 0;
    const durationMs = span.durationMs ?? 0;

    const id = span.spanId ?? span.id;
    const node: WaterfallNode = {
      id,
      kind: span.kind,
      name: getSpanName(span),
      traceId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      startMs,
      durationMs,
      isInstant,
      hasError: span.events.some((e) => e.kind === "error"),
      depth: 0,
      hasChildren: false,
      children: [],
      raw: span,
    };
    nodeMap.set(id, node);
  }

  // Link parents → children
  const roots: WaterfallNode[] = [];
  for (const node of nodeMap.values()) {
    const parentId = node.parentSpanId;
    if (parentId != null && nodeMap.has(parentId)) {
      const parent = nodeMap.get(parentId)!;
      parent.children.push(node);
      parent.hasChildren = true;
    } else {
      roots.push(node);
    }
  }

  // Assign depths + sort children by startMs
  function assignDepth(node: WaterfallNode, depth: number): void {
    node.depth = depth;
    node.children.sort((a, b) => a.startMs - b.startMs);
    for (const child of node.children) {
      assignDepth(child, depth + 1);
    }
  }
  roots.sort((a, b) => a.startMs - b.startMs);
  for (const root of roots) {
    assignDepth(root, 0);
  }

  // totalDurationMs = furthest end time of any node
  let totalDurationMs = 0;
  for (const node of nodeMap.values()) {
    const end = node.startMs + node.durationMs;
    if (end > totalDurationMs) {
      totalDurationMs = end;
    }
  }

  // allNodes in DFS order (used by minimap -shows everything)
  const allNodes: WaterfallNode[] = [];
  function collectAll(node: WaterfallNode): void {
    allNodes.push(node);
    for (const child of node.children) {
      collectAll(child);
    }
  }
  for (const root of roots) {
    collectAll(root);
  }

  return { roots, allNodes, totalDurationMs, traceStartMs };
}

// Ported from Jaeger UI: VirtualizedTraceView.generateRowStates
// https://github.com/jaegertracing/jaeger-ui/blob/main/packages/jaeger-ui/src/components/
//   TracePage/TraceTimelineViewer/VirtualizedTraceView.tsx
//
// Works by tracking a `collapseDepth` threshold during DFS. When we enter a
// collapsed node we record its depth+1 as the threshold; any descendant at or
// below that depth is hidden. When we exit the subtree (next sibling has depth
// less than the threshold) we clear it.
export function generateRowStates(
  roots: WaterfallNode[],
  expanded: Set<string>,
): RowState[] {
  const result: RowState[] = [];
  let collapseDepth: number | null = null;

  function walk(node: WaterfallNode): void {
    let isHidden = false;

    if (collapseDepth !== null) {
      if (node.depth >= collapseDepth) {
        isHidden = true;
      } else {
        collapseDepth = null;
      }
    }

    result.push({ node, isHidden });

    if (!isHidden && node.hasChildren && !expanded.has(node.id)) {
      collapseDepth = node.depth + 1;
    }

    for (const child of node.children) {
      walk(child);
    }
  }

  for (const root of roots) {
    walk(root);
  }

  return result;
}

// Ported from Jaeger UI: createViewedBoundsFunc
// Maps absolute span times (ms relative to trace start) to [0,1] fractions
// within the current view window, so span bars can be positioned with CSS.
export function getViewedBounds(
  totalDurationMs: number,
  viewRange: ViewRange,
): (startMs: number, endMs: number) => { start: number; end: number } {
  const viewStartMs = viewRange.start * totalDurationMs;
  const viewEndMs = viewRange.end * totalDurationMs;
  const viewDurationMs = viewEndMs - viewStartMs;

  return (startMs: number, endMs: number) => ({
    start: viewDurationMs > 0 ? (startMs - viewStartMs) / viewDurationMs : 0,
    end: viewDurationMs > 0 ? (endMs - viewStartMs) / viewDurationMs : 0,
  });
}

export function getSpanName(span: ExecutionSpanItem): string {
  const attrs = span.attributes as Record<string, unknown> | null;

  const file = attrs != null && "file" in attrs && attrs.file != null && typeof attrs.file === "object"
    ? attrs.file as Record<string, unknown>
    : null;
  const fileName = file != null && typeof file.name === "string" ? file.name : undefined;
  const routeId = attrs != null && typeof attrs.routeId === "string" ? attrs.routeId : undefined;
  const version = attrs != null && typeof attrs.version === "string" ? attrs.version : undefined;
  const pipelineId = attrs != null && typeof attrs.pipelineId === "string" ? attrs.pipelineId : undefined;

  if (span.kind === "pipeline") {
    return pipelineId ?? "pipeline";
  }

  if (span.kind === "version") {
    return version != null ? `v${version}` : "version";
  }

  if (span.kind === "source.listing") {
    return version != null ? `source.listing v${version}` : "source.listing";
  }

  if (span.kind === "file.route") {
    if (routeId != null && fileName != null) return `${routeId}: ${fileName}`;
    if (routeId != null) return routeId;
    if (fileName != null) return fileName;
    return "file.route";
  }

  if (span.kind === "parse" || span.kind === "resolve") {
    if (routeId != null && fileName != null) return `${span.kind} · ${routeId}: ${fileName}`;
    if (routeId != null) return `${span.kind} · ${routeId}`;
    if (fileName != null) return `${span.kind} · ${fileName}`;
    return span.kind;
  }

  if (span.kind === "output") {
    const outputId = attrs != null && typeof attrs.outputId === "string" ? attrs.outputId : undefined;
    if (routeId != null && outputId != null) return `output ${routeId} → ${outputId}`;
    if (routeId != null) return `output ${routeId}`;
    if (outputId != null) return `output ${outputId}`;
    return "output";
  }

  if (version != null) return `${span.kind} v${version}`;
  if (routeId != null) return `${span.kind} ${routeId}`;
  if (fileName != null) return `${span.kind} ${fileName}`;
  return span.kind;
}

export function getSpanColor(node: { kind: string; hasError?: boolean }): string {
  if (node.hasError) return "#ef4444";

  switch (node.kind) {
    case "pipeline": return "#3b82f6";
    case "version": return "#60a5fa";
    case "file.route": return "#0ea5e9";
    case "parse": return "#818cf8";
    case "resolve": return "#a78bfa";
    case "source.listing": return "#2dd4bf";
    case "source.provided": return "#94a3b8";
    case "output": return "#06b6d4";
    case "error": return "#f59e0b";
    case "cache.hit": return "#22c55e";
    case "cache.miss": return "#f97316";
    case "cache.store": return "#eab308";
    default: return "#64748b";
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Ported from Jaeger UI: toPercent
export function toPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
