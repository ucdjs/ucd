import { formatTickLabel } from "./shared";

export interface ExecutionWaterfallAxisProps {
  durationMs: number;
  ticks: number[];
}

export function ExecutionWaterfallAxis({
  durationMs,
  ticks,
}: ExecutionWaterfallAxisProps) {
  return (
    <div className="grid gap-2 pt-1 text-[11px] text-muted-foreground md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <div className="flex items-center justify-between rounded-lg border border-transparent px-3 uppercase tracking-wide">
        <span>Span</span>
        <span>Duration</span>
      </div>
      <div className="relative hidden h-5 min-w-0 md:block">
        {ticks.map((tick) => {
          const left = (tick / durationMs) * 100;
          return (
            <div key={tick} className="absolute inset-y-0" style={{ left: `${left}%` }}>
              <div className="h-full w-px bg-border/60" />
              <div className="absolute -top-1 -translate-x-1/2 bg-background px-1 text-[10px]">
                {formatTickLabel(tick)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
