import { formatTickLabel, getTimelineTickColumn, timelineColumns } from "./shared";

export interface ExecutionWaterfallAxisProps {
  durationMs: number;
  ticks: number[];
}

export function ExecutionWaterfallAxis({
  durationMs,
  ticks,
}: ExecutionWaterfallAxisProps) {
  return (
    <div
      className="grid gap-0 border-b border-border/60 px-3 py-2 text-xs text-muted-foreground"
      style={{ gridTemplateColumns: "15rem minmax(0, 1fr)" }}
    >
      <div className="flex items-center border-r border-border/50 pr-4 font-medium uppercase tracking-wide">
        <span>Name</span>
      </div>
      <div
        className="grid h-6 min-w-0 pl-4"
        style={{ gridTemplateColumns: `repeat(${timelineColumns}, minmax(0, 1fr))` }}
      >
        {ticks.map((tick) => {
          const column = getTimelineTickColumn(tick, durationMs);
          return (
            <div
              key={tick}
              className="flex h-full items-center border-l border-border/50 text-xs"
              style={{ gridColumnStart: column, gridRowStart: 1 }}
            >
              <div className="bg-background px-1">
                {formatTickLabel(tick)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
