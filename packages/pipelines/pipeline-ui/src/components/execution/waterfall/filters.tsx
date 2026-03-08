import type { ExecutionSpan } from "#lib/execution-logs";
import { cn } from "#lib/utils";
import { getPhaseAccentClass, getPhaseColor, phaseLabels, phaseOptions } from "./shared";

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
    <div className="flex flex-wrap gap-1.5">
      {phaseOptions.map((phase) => {
        const isActive = activePhases.has(phase);
        const visibleCount = spans.filter((span) => span.phase === phase).length;

        return (
          <button
            key={phase}
            type="button"
            onClick={() => onTogglePhase(phase)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
              isActive
                ? getPhaseAccentClass(phase)
                : "border-border/40 bg-transparent text-muted-foreground/70",
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", getPhaseColor(phase))} />
            <span className="font-medium">{phaseLabels[phase]}</span>
            <span className="text-muted-foreground/80">
              {visibleCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
