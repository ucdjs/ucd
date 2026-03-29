import { formatDuration } from "#lib/format";
import { toPercent } from "#lib/waterfall";

const TICK_FRACTIONS = [0, 0.25, 0.5, 0.75, 1] as const;

interface TimelineAxisProps {
  visibleStartMs: number;
  visibleDurationMs: number;
}

export function TimelineAxis({ visibleStartMs, visibleDurationMs }: TimelineAxisProps) {
  return (
    <div className="relative h-6">
      {TICK_FRACTIONS.map((fraction) => (
        <span
          key={fraction}
          className="absolute top-1 select-none whitespace-nowrap text-[10px] text-muted-foreground"
          style={{ left: toPercent(fraction), transform: `translateX(-${fraction * 100}%)` }}
        >
          {formatDuration(visibleStartMs + fraction * visibleDurationMs)}
        </span>
      ))}
    </div>
  );
}
