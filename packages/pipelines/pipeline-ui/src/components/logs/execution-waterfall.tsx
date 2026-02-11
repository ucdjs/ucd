import type { ExecutionSpan } from "#lib/execution-logs";
import { formatDuration } from "#lib/execution-logs";
import { cn } from "#lib/utils";
import { useState } from "react";

export interface ExecutionWaterfallProps {
  spans: ExecutionSpan[];
  selectedSpanId: string | null;
  onSelect: (spanId: string | null) => void;
  onSpanClick?: (span: ExecutionSpan) => void;
}

const phaseOptions = [
  "Pipeline",
  "Version",
  "Parse",
  "Resolve",
  "Artifact",
  "File",
  "Cache",
  "Error",
] as const;

type PhaseOption = typeof phaseOptions[number];

const phaseLabels: Record<PhaseOption, string> = {
  Pipeline: "Pipeline",
  Version: "Version",
  Parse: "Parse",
  Resolve: "Resolve",
  Artifact: "Artifact",
  File: "File",
  Cache: "Cache",
  Error: "Error",
};

function getPhaseColor(phase: string): string {
  switch (phase) {
    case "Pipeline":
      return "bg-sky-400/70";
    case "Version":
      return "bg-emerald-400/70";
    case "Parse":
      return "bg-amber-400/70";
    case "Resolve":
      return "bg-violet-400/70";
    case "Artifact":
      return "bg-rose-400/70";
    case "File":
      return "bg-cyan-400/70";
    case "Cache":
      return "bg-lime-400/70";
    case "Error":
      return "bg-red-500/80";
    default:
      return "bg-slate-400/70";
  }
}

function formatTickLabel(valueMs: number): string {
  if (valueMs <= 0) return "0ms";
  if (valueMs < 1) return "<1ms";
  return formatDuration(valueMs);
}

function buildTicks(durationMs: number, count = 6): number[] {
  if (durationMs <= 0) return [0];
  if (count < 2) return [0, durationMs];
  const step = durationMs / (count - 1);
  return Array.from({ length: count }, (_, index) => index * step);
}

export function ExecutionWaterfall({ spans, selectedSpanId, onSelect, onSpanClick }: ExecutionWaterfallProps) {
  const hasSpans = spans.length > 0;
  const [activePhases, setActivePhases] = useState<Set<string>>(
    () => new Set(phaseOptions),
  );
  const start = hasSpans ? Math.min(...spans.map((s) => s.start)) : 0;
  const end = hasSpans ? Math.max(...spans.map((s) => s.end)) : 0;
  const duration = Math.max(end - start, 1);

  const filteredSpans = spans.filter((span) => activePhases.has(span.phase));
  const sortedSpans = [...filteredSpans].sort((a, b) => a.start - b.start);
  const ticks = buildTicks(duration, 6);

  return (
    <div className="border border-border rounded-lg bg-card/40">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <div>
          <h3 className="text-xs font-semibold">Execution Timeline</h3>
          <p className="text-[11px] text-muted-foreground">
            {spans.length}
            {" "}
            spans ·
            {" "}
            {formatDuration(duration)}
          </p>
        </div>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onSelect(null)}
        >
          Clear filter
        </button>
      </div>

      <div className="p-2">
        <div
          className={cn(
            "border border-dashed border-border rounded-lg p-4 text-xs text-muted-foreground",
            hasSpans && "hidden",
          )}
        >
          No spans recorded for this execution.
        </div>

        <div className={cn(!hasSpans && "hidden")}>
          <div className="flex flex-wrap gap-2 pb-1 -mt-1">
            {phaseOptions.map((phase) => {
              const isActive = activePhases.has(phase);
              return (
                <button
                  key={phase}
                  type="button"
                  onClick={() => {
                    setActivePhases((current: Set<string>) => {
                      const next = new Set(current);
                      if (next.has(phase)) {
                        next.delete(phase);
                      } else {
                        next.add(phase);
                      }
                      return next.size === 0 ? current : next;
                    });
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide",
                    isActive ? "border-border text-foreground" : "border-border/40 text-muted-foreground/70",
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", getPhaseColor(phase))} />
                  {phaseLabels[phase]}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-[250px_minmax(0,1fr)] items-center text-[11px] text-muted-foreground pb-2 pt-4">
            <div className="uppercase tracking-wide">Name</div>
            <div className="relative h-4 min-w-0">
              {ticks.map((tick) => {
                const left = (tick / duration) * 100;
                return (
                  <div key={tick} className="absolute top-0 bottom-0" style={{ left: `${left}%` }}>
                    <div className="h-full w-px bg-border/60" />
                    <div className="absolute -top-4 -translate-x-1/2 text-[10px]">
                      {formatTickLabel(tick)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            {sortedSpans.map((span, index) => {
              const left = Math.min(((span.start - start) / duration) * 100, 100);
              const width = Math.max(((span.end - span.start) / duration) * 100, 1.5);
              const clampedWidth = Math.min(width, 100 - left);
              const isSelected = selectedSpanId === span.spanId;
              const phaseColor = span.isError ? "bg-red-500/80" : getPhaseColor(span.phase);
              const spanKey = `${span.spanId}-${span.start}-${span.end}-${span.phase}-${index}`;

              return (
                <div key={spanKey} className="grid grid-cols-[250px_minmax(0,1fr)] items-center">
                  <div className="text-xs text-muted-foreground truncate pr-3" title={span.label}>
                    {span.label}
                  </div>
                  <div className="relative h-6 rounded-sm bg-muted/40 min-w-0 overflow-hidden">
                    {ticks.map((tick) => {
                      const tickLeft = (tick / duration) * 100;
                      return (
                        <span
                          key={`${spanKey}-tick-${tick}`}
                          className="absolute top-0 bottom-0 w-px bg-border/40"
                          style={{ left: `${tickLeft}%` }}
                        />
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(span.spanId);
                        onSpanClick?.(span);
                      }}
                      className={cn(
                        "absolute top-1 h-4 rounded-sm text-[10px] font-medium text-white/90 px-1 truncate",
                        phaseColor,
                        isSelected && "ring-2 ring-offset-1 ring-primary",
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
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
