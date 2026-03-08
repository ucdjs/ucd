import type { ExecutionSpan } from "#lib/execution-logs";
import { cn } from "#lib/utils";
import { getPhaseColor, phaseLabels, phaseOptions } from "./shared";

export interface ExecutionWaterfallFiltersProps {
  spans: ExecutionSpan[];
  activePhases: Set<string>;
  onTogglePhase: (phase: string) => void;
}

export function ExecutionWaterfallFilters({
  spans,
  activePhases,
  onTogglePhase,
}: ExecutionWaterfallFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {phaseOptions.map((phase) => {
        const isActive = activePhases.has(phase);
        const visibleCount = spans.filter((span) => span.phase === phase).length;

        return (
          <button
            key={phase}
            type="button"
            onClick={() => onTogglePhase(phase)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[10px] uppercase tracking-wide transition-colors",
              isActive
                ? "border-border bg-background text-foreground"
                : "border-border/40 bg-muted/30 text-muted-foreground/70",
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", getPhaseColor(phase))} />
            {phaseLabels[phase]}
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] normal-case tracking-normal text-muted-foreground">
              {visibleCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
