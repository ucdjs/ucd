import type { PipelineTracePhase } from "@ucdjs/pipelines-core/tracing";
import type { ExecutionSpan } from "../../../lib/execution-utils";
import { cn } from "@ucdjs-internal/shared-ui";
import { PIPELINE_TRACE_PHASES } from "@ucdjs/pipelines-core/tracing";
import { phaseLabels } from "./shared";

export interface ExecutionWaterfallToolbarProps {
  spans: ExecutionSpan[];
  activePhases: Set<PipelineTracePhase>;
  onTogglePhase: (phase: PipelineTracePhase) => void;
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
        {PIPELINE_TRACE_PHASES.filter((phase) => presentPhases.has(phase)).map((phase) => {
          const isActive = activePhases.has(phase);
          const visibleCount = spans.filter((span) => span.phase === phase).length;

          return (
            <button
              key={phase}
              type="button"
              onClick={() => onTogglePhase(phase)}
              data-phase={phase}
              className={cn(
                "execution-phase inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
                isActive
                  ? "execution-phase-chip"
                  : "border-border/40 bg-transparent text-muted-foreground/70",
              )}
            >
              <span className="execution-phase-dot h-2 w-2 rounded-full" />
              <span className="font-medium">{phaseLabels[phase]}</span>
              <span className="text-muted-foreground/80">{visibleCount}</span>
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
