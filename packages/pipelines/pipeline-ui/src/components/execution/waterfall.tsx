import type { ExecutionSpan } from "#lib/execution-logs";
import { cn } from "#lib/utils";
import { useMemo, useState } from "react";
import { ExecutionWaterfallAxis } from "./waterfall/axis";
import { ExecutionWaterfallFilters } from "./waterfall/filters";
import { ExecutionWaterfallHeader } from "./waterfall/header";
import { ExecutionWaterfallRow } from "./waterfall/row";
import { buildTicks, phaseOptions } from "./waterfall/shared";

export interface ExecutionWaterfallProps {
  spans: ExecutionSpan[];
  selectedSpanId: string | null;
  onSelect: (spanId: string | null) => void;
  onSpanClick?: (span: ExecutionSpan) => void;
}

export function ExecutionWaterfall({ spans, selectedSpanId, onSelect, onSpanClick }: ExecutionWaterfallProps) {
  const hasSpans = spans.length > 0;
  const [activePhases, setActivePhases] = useState<Set<string>>(
    () => new Set(phaseOptions),
  );
  const start = hasSpans ? Math.min(...spans.map((s) => s.start)) : 0;
  const end = hasSpans ? Math.max(...spans.map((s) => s.end)) : 0;
  const duration = Math.max(end - start, 1);

  const filteredSpans = useMemo(
    () => spans.filter((span) => activePhases.has(span.phase)),
    [activePhases, spans],
  );
  const sortedSpans = useMemo(
    () => [...filteredSpans].sort((a, b) => a.start - b.start),
    [filteredSpans],
  );
  const ticks = buildTicks(duration, 5);
  const selectedSpan = spans.find((span) => span.spanId === selectedSpanId) ?? null;

  function handleTogglePhase(phase: string) {
    setActivePhases((current) => {
      const next = new Set(current);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next.size === 0 ? current : next;
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card/50">
      <ExecutionWaterfallHeader
        totalSpans={spans.length}
        visibleSpans={filteredSpans.length}
        durationMs={duration}
        selectedLabel={selectedSpan?.label ?? null}
        selectedSpanId={selectedSpanId}
        onClear={() => onSelect(null)}
      />

      <div className="space-y-4 p-3">
        <div
          className={cn(
            "rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground",
            hasSpans && "hidden",
          )}
        >
          No spans recorded for this execution.
        </div>

        <div className={cn(!hasSpans && "hidden")}>
          <ExecutionWaterfallFilters
            spans={spans}
            activePhases={activePhases}
            onTogglePhase={handleTogglePhase}
          />

          <ExecutionWaterfallAxis durationMs={duration} ticks={ticks} />

          <div className="space-y-1">
            {sortedSpans.map((span, index) => {
              const spanKey = `${span.spanId}-${span.start}-${span.end}-${span.phase}-${index}`;

              return (
                <ExecutionWaterfallRow
                  key={spanKey}
                  span={span}
                  selected={selectedSpanId === span.spanId}
                  start={start}
                  durationMs={duration}
                  ticks={ticks}
                  onSelect={(nextSpan) => {
                    onSelect(nextSpan.spanId);
                    onSpanClick?.(nextSpan);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
