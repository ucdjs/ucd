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
  const ticks = buildTicks(duration, 5);
  const selectedSpan = spans.find((span) => span.spanId === selectedSpanId) ?? null;

  return (
    <div className="rounded-xl border border-border bg-card/50">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Execution timeline</h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              {filteredSpans.length}
              {" "}
              of
              {" "}
              {spans.length}
              {" "}
              spans visible
            </span>
            <span className="hidden sm:inline">•</span>
            <span>{formatDuration(duration)} total runtime</span>
            {selectedSpan && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="text-foreground">
                  Selected:
                  {" "}
                  {selectedSpan.label}
                </span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          className={cn(
            "text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
            !selectedSpanId && "opacity-50",
          )}
          onClick={() => onSelect(null)}
        >
          Clear log filter
        </button>
      </div>

      <div className="space-y-4 p-3">
        <div
          className={cn(
            "rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground",
            hasSpans && "hidden",
          )}
        >
          No spans recorded for this execution.
        </div>

        <div className={cn(!hasSpans && "hidden")}>
          <div className="flex flex-wrap gap-2">
            {phaseOptions.map((phase) => {
              const isActive = activePhases.has(phase);
              const visibleCount = spans.filter((span) => span.phase === phase).length;
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

          <div className="grid gap-2 pt-1 text-[11px] text-muted-foreground md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <div className="flex items-center justify-between rounded-lg border border-transparent px-3 uppercase tracking-wide">
              <span>Span</span>
              <span>Duration</span>
            </div>
            <div className="relative hidden h-5 min-w-0 md:block">
              {ticks.map((tick) => {
                const left = (tick / duration) * 100;
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

          <div className="space-y-1">
            {sortedSpans.map((span, index) => {
              const left = Math.min(((span.start - start) / duration) * 100, 100);
              const width = Math.max(((span.end - span.start) / duration) * 100, 1.5);
              const clampedWidth = Math.min(width, 100 - left);
              const isSelected = selectedSpanId === span.spanId;
              const phaseColor = span.isError ? "bg-red-500/80" : getPhaseColor(span.phase);
              const spanKey = `${span.spanId}-${span.start}-${span.end}-${span.phase}-${index}`;

              return (
                <div
                  key={spanKey}
                  className={cn(
                    "grid gap-2 rounded-xl border border-border/70 bg-background/70 p-2 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:items-center",
                    isSelected && "border-primary/60 bg-primary/5",
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
                        "absolute top-1/2 h-5 -translate-y-1/2 rounded-md px-1.5 text-[10px] font-semibold text-white/90 shadow-sm transition-all",
                        phaseColor,
                        isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
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
