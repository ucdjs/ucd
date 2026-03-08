import type { PipelineEventPhase } from "@ucdjs/pipelines-core";
import type { ExecutionSpan } from "./execution-utils";
import { cn } from "@ucdjs-internal/shared-ui";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { PIPELINE_EVENT_PHASES } from "@ucdjs/pipelines-core";
import { useMemo, useState } from "react";
import { formatDuration, getPhaseAccentClass, getPhaseBarStyle, getPhaseColor } from "./execution-utils";

const phaseOptions = PIPELINE_EVENT_PHASES;
const timelineColumns = 100;

const phaseLabels: Record<PipelineEventPhase, string> = {
  Pipeline: "Pipeline",
  Version: "Version",
  Parse: "Parse",
  Resolve: "Resolve",
  Artifact: "Artifact",
  File: "File",
  Cache: "Cache",
  Error: "Error",
  Other: "Other",
};

function formatTickLabel(valueMs: number): string {
  if (valueMs <= 0) return "0ms";
  if (valueMs < 1) return "<1ms";
  return formatDuration(valueMs);
}

function buildTicks(durationMs: number, count = 5): number[] {
  if (durationMs <= 0) return [0];
  if (count < 2) return [0, durationMs];
  const step = durationMs / (count - 1);
  return Array.from({ length: count }, (_, index) => index * step);
}

function getTimelineTickColumn(tick: number, durationMs: number): number {
  if (durationMs <= 0) return 1;
  const ratio = Math.min(Math.max(tick / durationMs, 0), 1);
  return Math.min(timelineColumns, Math.floor(ratio * (timelineColumns - 1)) + 1);
}

function getTimelineGridRange(startMs: number, endMs: number, durationMs: number) {
  if (durationMs <= 0) {
    return { startColumn: 1, endColumn: 3 };
  }

  const startRatio = Math.min(Math.max(startMs / durationMs, 0), 1);
  const endRatio = Math.min(Math.max(endMs / durationMs, 0), 1);
  const startColumn = Math.min(
    timelineColumns,
    Math.floor(startRatio * (timelineColumns - 1)) + 1,
  );
  const endColumn = Math.max(
    startColumn + 1,
    Math.min(timelineColumns + 1, Math.ceil(endRatio * timelineColumns) + 1),
  );

  return { startColumn, endColumn };
}

function ExecutionWaterfallToolbar({
  spans,
  activePhases,
  onTogglePhase,
  selectedSpanId,
  onClear,
}: {
  spans: ExecutionSpan[];
  activePhases: Set<PipelineEventPhase>;
  onTogglePhase: (phase: PipelineEventPhase) => void;
  selectedSpanId: string | null;
  onClear: () => void;
}) {
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

function ExecutionWaterfallAxis({ durationMs, ticks }: { durationMs: number; ticks: number[] }) {
  return (
    <div
      className="grid gap-0 border-b border-border/40 px-3 py-2 text-xs text-muted-foreground"
      style={{ gridTemplateColumns: "15rem minmax(0, 1fr)" }}
    >
      <div className="flex items-center border-r border-border/35 pr-4 font-medium uppercase tracking-wide">
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
              className="flex h-full items-center border-l border-border/35 text-xs"
              style={{ gridColumnStart: column, gridRowStart: 1 }}
            >
              <div className="bg-background/95 px-1">{formatTickLabel(tick)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExecutionWaterfallRow({
  span,
  selected,
  start,
  durationMs,
  ticks,
  onSelect,
}: {
  span: ExecutionSpan;
  selected: boolean;
  start: number;
  durationMs: number;
  ticks: number[];
  onSelect: (span: ExecutionSpan) => void;
}) {
  const phaseColor = span.isError ? "bg-red-500/80" : getPhaseColor(span.phase);
  const phaseBadgeClass = span.isError
    ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
    : getPhaseAccentClass(span.phase);
  const phaseBarStyle = span.isError
    ? { background: "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)" }
    : getPhaseBarStyle(span.phase);
  const { startColumn, endColumn } = getTimelineGridRange(
    span.start - start,
    span.end - start,
    durationMs,
  );

  return (
    <div
      className={cn("grid gap-0 border-b border-border/25 px-3 py-1.5", selected && "bg-accent/20")}
      style={{ gridTemplateColumns: "15rem minmax(0, 1fr)" }}
    >
      <div className="min-w-0 border-r border-border/35 pr-4">
        <div className="flex min-w-0 gap-1.5">
          <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", phaseColor)} />
          <div className="min-w-0 space-y-0.5">
            <div className="truncate text-sm font-medium leading-tight" title={span.label}>
              {span.label}
            </div>
            <div className="flex items-center gap-1.5 text-xs leading-none text-muted-foreground">
              <Badge
                variant="outline"
                className={cn("h-5 rounded-sm px-1.5 text-[10px] font-medium uppercase leading-none", phaseBadgeClass)}
              >
                {span.phase}
              </Badge>
              <span className="font-medium text-muted-foreground">{formatDuration(span.durationMs)}</span>
              {span.isError && <span className="text-red-600 dark:text-red-400">Error</span>}
            </div>
          </div>
        </div>
      </div>
      <div
        className="grid h-6 min-w-0 overflow-hidden pl-4"
        style={{
          gridTemplateColumns: `repeat(${timelineColumns}, minmax(0, 1fr))`,
          backgroundImage: "repeating-linear-gradient(to right, transparent, transparent calc(20% - 1px), rgb(255 255 255 / 0.05) calc(20% - 1px), rgb(255 255 255 / 0.05) 20%)",
        }}
      >
        {ticks.map((tick) => {
          const column = getTimelineTickColumn(tick, durationMs);
          return (
            <span
              key={`${span.spanId}-${tick}`}
              className="h-full border-l border-border/30"
              style={{ gridColumnStart: column, gridRowStart: 1 }}
            />
          );
        })}
        <button
          type="button"
          onClick={() => onSelect(span)}
          className={cn(
            "my-1.5 h-3 rounded-[2px] px-1.5 text-xs font-medium text-white transition-all",
            selected && "ring-1 ring-foreground/50",
          )}
          style={{
            gridColumn: `${startColumn} / ${endColumn}`,
            gridRowStart: 1,
            ...phaseBarStyle,
          }}
          title={`${span.label} · ${formatDuration(span.durationMs)}`}
        >
          <span className="block truncate text-left">{formatDuration(span.durationMs)}</span>
        </button>
      </div>
    </div>
  );
}

export interface ExecutionWaterfallProps {
  spans: ExecutionSpan[];
  selectedSpanId: string | null;
  onSelect: (spanId: string | null) => void;
  onSpanClick?: (span: ExecutionSpan) => void;
}

export function ExecutionWaterfall({ spans, selectedSpanId, onSelect, onSpanClick }: ExecutionWaterfallProps) {
  const hasSpans = spans.length > 0;
  const availablePhases = useMemo(
    () => phaseOptions.filter((phase) => spans.some((span) => span.phase === phase)),
    [spans],
  );
  const [activePhases, setActivePhases] = useState<Set<PipelineEventPhase>>(
    () => new Set(phaseOptions),
  );
  const visibleActivePhases = useMemo(() => {
    const next = new Set(availablePhases.filter((phase) => activePhases.has(phase)));
    return next.size === 0 ? new Set(availablePhases) : next;
  }, [activePhases, availablePhases]);
  const start = hasSpans ? Math.min(...spans.map((span) => span.start)) : 0;
  const end = hasSpans ? Math.max(...spans.map((span) => span.end)) : 0;
  const duration = Math.max(end - start, 1);

  const filteredSpans = useMemo(
    () => spans.filter((span) => visibleActivePhases.has(span.phase)),
    [spans, visibleActivePhases],
  );
  const sortedSpans = useMemo(
    () => [...filteredSpans].sort((a, b) => a.start - b.start),
    [filteredSpans],
  );
  const ticks = buildTicks(duration, 5);

  function handleTogglePhase(phase: PipelineEventPhase) {
    setActivePhases((current) => {
      const next = new Set(current);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next.size === 0 ? current : next;
    });
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground",
          hasSpans && "hidden",
        )}
      >
        No spans recorded for this execution.
      </div>

      <div className={cn("space-y-3", !hasSpans && "hidden")}>
        <ExecutionWaterfallToolbar
          spans={spans}
          activePhases={visibleActivePhases}
          onTogglePhase={handleTogglePhase}
          selectedSpanId={selectedSpanId}
          onClear={() => onSelect(null)}
        />

        <ExecutionWaterfallAxis durationMs={duration} ticks={ticks} />

        <div>
          {sortedSpans.map((span, index) => {
            const spanKey = `${span.spanId}-${span.start}-${span.end}-${span.phase}-${index}`;

            return (
              <ExecutionWaterfallRow
                key={spanKey}
                span={span}
                selected={selectedSpanId === span.spanId}
                start={start}
                durationMs={duration}
                ticks={ticks}
                onSelect={(nextSpan) => {
                  onSelect(nextSpan.spanId);
                  onSpanClick?.(nextSpan);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
