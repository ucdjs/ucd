import type { ViewRange } from "#lib/waterfall";
import type { ExecutionSpanItem } from "#shared/schemas/execution";
import { SpanWaterfall } from "#components/execution/waterfall/span-waterfall";
import { formatDuration, formatTimestamp } from "#lib/format";
import {
  buildWaterfallTree,
  generateRowStates,
  getViewedBounds,
} from "#lib/waterfall";
import { useMemo, useState } from "react";
import { SpanDetails } from "./span-details";
import { SpanRow } from "./span-row";
import { TimelineAxis } from "./timeline-axis";

interface WaterfallViewProps {
  traceId: string | null;
  spans: ExecutionSpanItem[];
  onSpanSelect?: (spanId: string | null) => void;
}

export function WaterfallView({ traceId, spans, onSpanSelect }: WaterfallViewProps) {
  const { roots, allNodes, totalDurationMs, traceStartMs } = useMemo(
    () => buildWaterfallTree(spans, traceId),
    [spans, traceId],
  );

  const [expanded, setExpanded] = useState<Set<string>>(() =>
    new Set(allNodes.filter((n) => n.hasChildren && n.depth <= 3).map((n) => n.id)),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewRange, setViewRange] = useState<ViewRange>({ start: 0, end: 1 });

  const rowStates = useMemo(
    () => generateRowStates(roots, expanded),
    [roots, expanded],
  );

  const visibleRows = rowStates.filter((r) => !r.isHidden);

  const viewedBounds = useMemo(
    () => getViewedBounds(totalDurationMs, viewRange),
    [totalDurationMs, viewRange],
  );

  const visibleStartMs = viewRange.start * totalDurationMs;
  const visibleDurationMs = (viewRange.end - viewRange.start) * totalDurationMs;

  const selectedNode = useMemo(
    () => allNodes.find((n) => n.id === selectedId) ?? null,
    [allNodes, selectedId],
  );

  // eslint-disable-next-line react/purity -- React Compiler handles memoization
  const traceStartFormatted = formatTimestamp(new Date(traceStartMs).toISOString());

  const expandAll = () => {
    setExpanded(new Set(allNodes.filter((n) => n.hasChildren).map((n) => n.id)));
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  const handleToggle = (nodeId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-6 border-b px-4 py-2 text-sm">
        <span>
          <span className="text-muted-foreground">Trace Start </span>
          <span className="font-medium">{traceStartFormatted}</span>
        </span>
        <span>
          <span className="text-muted-foreground">Duration </span>
          <span className="font-medium">{formatDuration(totalDurationMs)}</span>
        </span>
        <span>
          <span className="text-muted-foreground">Spans </span>
          <span className="font-medium">{allNodes.length}</span>
        </span>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={expandAll}
            className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Collapse all
          </button>
        </div>
      </div>

      <SpanWaterfall
        nodes={allNodes}
        totalDurationMs={totalDurationMs}
        viewRange={viewRange}
        onViewRangeChange={setViewRange}
      />

      <div className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 flex shrink-0 border-b bg-background">
          <div className="w-2/5 shrink-0 px-4 py-1 text-xs text-muted-foreground">
            Service &amp; Operation
          </div>
          <div className="flex-1 py-1 pr-2">
            <TimelineAxis
              visibleStartMs={visibleStartMs}
              visibleDurationMs={visibleDurationMs}
            />
          </div>
        </div>

        {visibleRows.map(({ node }) => (
          <SpanRow
            key={node.id}
            node={node}
            viewedBounds={viewedBounds}
            isSelected={selectedId === node.id}
            isExpanded={expanded.has(node.id)}
            onSelect={() => {
              const deselect = node.id === selectedId;
              setSelectedId(deselect ? null : node.id);
              onSpanSelect?.(deselect ? null : node.spanId);
            }}
            onToggle={() => handleToggle(node.id)}
          />
        ))}
      </div>

      <SpanDetails node={selectedNode} onClose={() => setSelectedId(null)} />
    </div>
  );
}
