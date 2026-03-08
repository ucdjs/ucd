import type { ExecutionSpan } from "#lib/execution-logs";
import { formatDuration } from "#lib/execution-logs";
import { cn } from "#lib/utils";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import {
  getPhaseAccentClass,
  getPhaseBarStyle,
  getPhaseColor,
  getTimelineGridRange,
  getTimelineTickColumn,
  timelineColumns,
} from "./shared";

export interface ExecutionWaterfallRowProps {
  span: ExecutionSpan;
  selected: boolean;
  start: number;
  durationMs: number;
  ticks: number[];
  onSelect: (span: ExecutionSpan) => void;
}

export function ExecutionWaterfallRow({
  span,
  selected,
  start,
  durationMs,
  ticks,
  onSelect,
}: ExecutionWaterfallRowProps) {
  const phaseColor = span.isError ? "bg-red-500/80" : getPhaseColor(span.phase);
  const phaseBadgeClass = span.isError
    ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
    : getPhaseAccentClass(span.phase);
  const phaseBarStyle = span.isError
    ? { background: "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)" }
    : getPhaseBarStyle(span.phase);
  const { startColumn, endColumn } = getTimelineGridRange(
    span.start - start,
    span.end - start,
    durationMs,
  );

  return (
    <div
      className={cn(
        "grid gap-0 border-b border-border/25 px-3 py-1.5",
        selected && "bg-accent/20",
      )}
      style={{ gridTemplateColumns: "15rem minmax(0, 1fr)" }}
    >
      <div className="min-w-0 border-r border-border/35 pr-4">
        <div className="flex min-w-0 gap-1.5">
          <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", phaseColor)} />
          <div className="min-w-0 space-y-0.5">
            <div className="truncate text-sm font-medium leading-tight" title={span.label}>
              {span.label}
            </div>
            <div className="flex items-center gap-1.5 text-xs leading-none text-muted-foreground">
              <Badge
                variant="outline"
                className={cn("h-5 rounded-sm px-1.5 text-[10px] font-medium uppercase leading-none", phaseBadgeClass)}
              >
                {span.phase}
              </Badge>
              <span className="font-medium text-muted-foreground">{formatDuration(span.durationMs)}</span>
              {span.isError && (
                <span className="text-red-600 dark:text-red-400">Error</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        className="grid h-6 min-w-0 overflow-hidden pl-4"
        style={{
          gridTemplateColumns: `repeat(${timelineColumns}, minmax(0, 1fr))`,
          backgroundImage: "repeating-linear-gradient(to right, transparent, transparent calc(20% - 1px), rgb(255 255 255 / 0.05) calc(20% - 1px), rgb(255 255 255 / 0.05) 20%)",
        }}
      >
        {ticks.map((tick) => {
          const column = getTimelineTickColumn(tick, durationMs);
          return (
            <span
              key={`${span.spanId}-${tick}`}
              className="h-full border-l border-border/30"
              style={{ gridColumnStart: column, gridRowStart: 1 }}
            />
          );
        })}
        <button
          type="button"
          onClick={() => onSelect(span)}
          className={cn(
            "my-1.5 h-3 rounded-[2px] px-1.5 text-xs font-medium text-white transition-all",
            selected && "ring-1 ring-foreground/50",
          )}
          style={{
            gridColumn: `${startColumn} / ${endColumn}`,
            gridRowStart: 1,
            ...phaseBarStyle,
          }}
          title={`${span.label} · ${formatDuration(span.durationMs)}`}
        >
          <span className="block truncate text-left">{formatDuration(span.durationMs)}</span>
        </button>
      </div>
    </div>
  );
}
