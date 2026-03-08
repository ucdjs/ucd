import type { ExecutionSpan } from "#lib/execution-logs";
import { formatDuration } from "#lib/execution-logs";
import { cn } from "#lib/utils";
import {
  getPhaseBarStyle,
  getPhaseAccentClass,
  getPhaseColor,
  getPhaseTextClass,
  getTimelineGridRange,
  getTimelineTickColumn,
  getPhaseTrackStyle,
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
  const phaseTrackStyle = span.isError
    ? { backgroundColor: "rgb(220 38 38 / 0.18)" }
    : getPhaseTrackStyle(span.phase);
  const { startColumn, endColumn } = getTimelineGridRange(
    span.start - start,
    span.end - start,
    durationMs,
  );

  return (
    <div
      className={cn(
        "grid gap-0 border-b border-border/35 px-3 py-1.5",
        selected && "bg-primary/4",
      )}
      style={{ gridTemplateColumns: "15rem minmax(0, 1fr)" }}
    >
      <div className="min-w-0 border-r border-border/50 pr-4">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", phaseColor)} />
          <span className="truncate text-sm font-medium" title={span.label}>
            {span.label}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 pl-3.5 text-xs text-muted-foreground">
          <span className={cn("rounded-full border px-1.5 py-0.5 font-medium uppercase leading-none", phaseBadgeClass)}>
            {span.phase}
          </span>
          <span className={cn("font-medium", getPhaseTextClass(span.phase))}>
            {formatDuration(span.durationMs)}
          </span>
          {span.isError && (
            <span className="text-red-600 dark:text-red-400">Error</span>
          )}
        </div>
      </div>
      <div
        className="grid h-6 min-w-0 overflow-hidden pl-4"
        style={{
          gridTemplateColumns: `repeat(${timelineColumns}, minmax(0, 1fr))`,
          backgroundImage: "repeating-linear-gradient(to right, transparent, transparent calc(20% - 1px), rgb(255 255 255 / 0.08) calc(20% - 1px), rgb(255 255 255 / 0.08) 20%)",
        }}
      >
        {ticks.map((tick) => {
          const column = getTimelineTickColumn(tick, durationMs);
          return (
            <span
              key={`${span.spanId}-${tick}`}
              className="h-full border-l border-border/45"
              style={{ gridColumnStart: column, gridRowStart: 1 }}
            />
          );
        })}
        <span
          className="my-1 rounded-[2px]"
          style={{
            gridColumn: `${startColumn} / ${endColumn}`,
            gridRowStart: 1,
            ...phaseTrackStyle,
          }}
        />
        <button
          type="button"
          onClick={() => onSelect(span)}
          className={cn(
            "my-1 h-4 rounded-[2px] px-1.5 text-xs font-semibold text-white shadow-sm transition-all",
            selected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
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
