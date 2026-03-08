import type { ExecutionSpan } from "#lib/execution-logs";
import type { PipelineEventPhase } from "@ucdjs/pipelines-core";
import { cn } from "#lib/utils";
import { getPhaseAccentClass, getPhaseColor, phaseLabels, phaseOptions } from "./shared";

export interface ExecutionWaterfallToolbarProps {
  spans: ExecutionSpan[];
  activePhases: Set<PipelineEventPhase>;
  onTogglePhase: (phase: PipelineEventPhase) => void;
  selectedSpanId: string | null;
  onClear: () => void;
}

export function ExecutionWaterfallToolbar({
  spans,
  activePhases,
  onTogglePhase,
  selectedSpanId,
  onClear,
}: ExecutionWaterfallToolbarProps) {
  const presentPhases = new Set(spans.map((span) => span.phase));

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap gap-1.5">
        {phaseOptions.filter((phase) => presentPhases.has(phase)).map((phase) => {
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

      {selectedSpanId && (
        <button
          type="button"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          onClick={onClear}
        >
          Clear log filter
        </button>
      )}
    </div>
  );
}
