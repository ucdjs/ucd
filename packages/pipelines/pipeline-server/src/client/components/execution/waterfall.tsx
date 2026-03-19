import type { PipelineEventPhase } from "@ucdjs/pipelines-core";
import type { ExecutionSpan } from "../../lib/execution-utils";
import { cn } from "@ucdjs-internal/shared-ui";
import { PIPELINE_EVENT_PHASES } from "@ucdjs/pipelines-core";
import { useMemo, useState } from "react";
import { ExecutionWaterfallAxis } from "./waterfall/axis";
import { ExecutionWaterfallRow } from "./waterfall/row";
import { buildTicks } from "./waterfall/shared";
import { ExecutionWaterfallToolbar } from "./waterfall/toolbar";

export interface ExecutionWaterfallProps {
  spans: ExecutionSpan[];
  selectedSpanId: string | null;
  onSelect: (spanId: string | null) => void;
  onSpanClick?: (span: ExecutionSpan) => void;
}

export function ExecutionWaterfall({
  spans,
  selectedSpanId,
  onSelect,
  onSpanClick,
}: ExecutionWaterfallProps) {
  const hasSpans = spans.length > 0;
  const start = hasSpans ? Math.min(...spans.map((span) => span.start)) : 0;
  const end = hasSpans ? Math.max(...spans.map((span) => span.end)) : 0;
  const duration = Math.max(end - start, 1);

  const availablePhases = useMemo(() => PIPELINE_EVENT_PHASES.filter((phase) => spans.some((span) => span.phase === phase)), [spans]);
  const [activePhases, setActivePhases] = useState<Set<PipelineEventPhase>>(
    () => new Set(availablePhases),
  );

  const visibleActivePhases = useMemo(() => {
    const next = new Set(availablePhases.filter((phase) => activePhases.has(phase)));
    return next.size === 0 ? new Set(availablePhases) : next;
  }, [activePhases, availablePhases]);

  const filteredSpans = useMemo(
    () => spans.filter((span) => visibleActivePhases.has(span.phase)),
    [spans, visibleActivePhases],
  );
  const sortedSpans = useMemo(
    () => filteredSpans.toSorted((a, b) => a.start - b.start),
    [filteredSpans],
  );
  const ticks = buildTicks(duration, 5);

  function handleTogglePhase(phase: PipelineEventPhase) {
    setActivePhases((current) => {
      const next = new Set(availablePhases.filter((item) => current.has(item)));
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next.size === 0 ? current : next;
    });
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground",
          hasSpans && "hidden",
        )}
      >
        No spans recorded for this execution.
      </div>

      <div className={cn("space-y-3", !hasSpans && "hidden")}>
        <ExecutionWaterfallToolbar
          spans={spans}
          activePhases={visibleActivePhases}
          onTogglePhase={handleTogglePhase}
          selectedSpanId={selectedSpanId}
          onClear={() => onSelect(null)}
        />

        <ExecutionWaterfallAxis durationMs={duration} ticks={ticks} />

        <div>
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
  );
}
