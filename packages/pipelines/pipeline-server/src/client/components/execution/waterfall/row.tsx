import type { ExecutionSpan } from "#lib/execution-utils";
import { formatDuration } from "#lib/format";
import { cn } from "@ucdjs-internal/shared-ui";
import { getTimelineGridRange, getTimelineTickColumn, timelineColumns } from "./shared";

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
  const { startColumn, endColumn } = getTimelineGridRange(
    span.start - start,
    span.end - start,
    durationMs,
  );

  return (
    <div
      className={cn("execution-phase grid gap-0 border-b border-border/25 px-3 py-1.5", selected && "bg-accent/20")}
      data-phase={span.phase}
      data-error={span.isError ? true : undefined}
      style={{ gridTemplateColumns: "15rem minmax(0, 1fr)" }}
    >
      <div className="min-w-0 border-r border-border/35 pr-4">
        <div className="flex min-w-0 gap-1.5" style={span.depth > 0 ? { paddingLeft: `${span.depth * 12}px` } : undefined}>
          <span className="execution-phase-dot mt-1 h-2 w-2 shrink-0 rounded-full" />
          <div className="min-w-0 space-y-0.5">
            <div className="truncate text-sm font-medium leading-tight" title={span.label}>
              {span.label}
            </div>
            <div className="flex items-center gap-1.5 text-xs leading-none text-muted-foreground">
              <span className="execution-phase-chip inline-flex h-5 items-center rounded-md border px-2 py-1 text-[10px] font-medium uppercase leading-none">
                {span.phase}
              </span>
              <span className="font-medium text-muted-foreground">{formatDuration(span.durationMs)}</span>
              {span.isError && <span className="text-red-600 dark:text-red-400">Error</span>}
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
          aria-label={`${span.label} ${formatDuration(span.durationMs)}`}
          className={cn(
            "execution-phase-bar my-1.5 h-3 rounded-[2px] px-1.5 text-xs font-medium text-white transition-all",
            selected && "ring-1 ring-foreground/50",
          )}
          style={{
            gridColumn: `${startColumn} / ${endColumn}`,
            gridRowStart: 1,
          }}
          title={`${span.label} · ${formatDuration(span.durationMs)}`}
        >
          <span className="block truncate text-left">{formatDuration(span.durationMs)}</span>
        </button>
      </div>
    </div>
  );
}
