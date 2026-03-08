import type { ExecutionSpan } from "#lib/execution-logs";
import { formatDuration } from "#lib/execution-logs";
import { cn } from "#lib/utils";
import { getPhaseColor } from "./shared";

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
  const left = Math.min(((span.start - start) / durationMs) * 100, 100);
  const width = Math.max(((span.end - span.start) / durationMs) * 100, 1.5);
  const clampedWidth = Math.min(width, 100 - left);
  const phaseColor = span.isError ? "bg-red-500/80" : getPhaseColor(span.phase);

  return (
    <div
      className={cn(
        "grid gap-2 rounded-xl border border-border/70 bg-background/70 p-2 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:items-center",
        selected && "border-primary/60 bg-primary/5",
      )}
    >
      <div className="min-w-0 px-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", phaseColor)} />
          <span className="truncate text-sm font-medium" title={span.label}>
            {span.label}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span>{span.phase}</span>
          <span>•</span>
          <span>{formatDuration(span.durationMs)}</span>
          {span.isError && (
            <>
              <span>•</span>
              <span className="text-red-600 dark:text-red-400">Error</span>
            </>
          )}
        </div>
      </div>
      <div className="relative h-9 min-w-0 overflow-hidden rounded-lg border border-border/60 bg-muted/40">
        {ticks.map((tick) => {
          const tickLeft = (tick / durationMs) * 100;
          return (
            <span
              key={`${span.spanId}-${tick}`}
              className="absolute top-0 bottom-0 w-px bg-border/40"
              style={{ left: `${tickLeft}%` }}
            />
          );
        })}
        <button
          type="button"
          onClick={() => onSelect(span)}
          className={cn(
            "absolute top-1/2 h-5 -translate-y-1/2 rounded-md px-1.5 text-[10px] font-semibold text-white/90 shadow-sm transition-all",
            phaseColor,
            selected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
          )}
          style={{
            left: `${Math.min(left, 98)}%`,
            width: `${clampedWidth}%`,
          }}
          title={`${span.label} · ${formatDuration(span.durationMs)}`}
        >
          {formatDuration(span.durationMs)}
        </button>
      </div>
    </div>
  );
}
