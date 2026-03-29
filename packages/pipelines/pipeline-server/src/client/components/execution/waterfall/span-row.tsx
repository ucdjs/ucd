import type { WaterfallNode } from "#lib/waterfall";
import { formatDuration } from "#lib/format";
import { clamp, getSpanColor, toPercent } from "#lib/waterfall";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SpanRowProps {
  node: WaterfallNode;
  viewedBounds: (startMs: number, endMs: number) => { start: number; end: number };
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggle: () => void;
}

export function SpanRow({
  node,
  viewedBounds,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
}: SpanRowProps) {
  const color = getSpanColor(node.kind);

  const bounds = viewedBounds(node.startMs, node.startMs + node.durationMs);
  const leftPct = clamp(bounds.start, 0, 1);
  const rightPct = clamp(bounds.end, 0, 1);
  const widthPct = rightPct - leftPct;
  const hintSide = leftPct > 0.6 ? "left" : "right";
  const labelInside = !node.isInstant && widthPct > 0.08;

  const instantPct = node.isInstant ? clamp(viewedBounds(node.startMs, node.startMs).start, 0, 1) : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      className={`flex items-stretch cursor-pointer border-b border-border/40 text-sm ${isSelected ? "bg-muted" : "hover:bg-muted/50"}`}
    >
      <div
        className="flex w-2/5 shrink-0 items-center gap-1 py-1 pr-3 min-w-0"
        style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
      >
        {node.hasChildren
          ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                {isExpanded
                  ? <ChevronDown className="h-3.5 w-3.5" />
                  : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            )
          : <span className="w-3.5 shrink-0" />}

        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />

        <span className="min-w-0 truncate text-xs">{node.name}</span>

        {!node.isInstant && (
          <span className="ml-auto shrink-0 pl-2 text-xs text-muted-foreground">
            {formatDuration(node.durationMs)}
          </span>
        )}
      </div>

      <div className="relative flex-1 py-1">
        {!node.isInstant && (
          <>
            <div
              className="absolute bottom-1 top-1 rounded-sm"
              style={{
                left: toPercent(leftPct),
                width: `max(2px, ${toPercent(widthPct)})`,
                backgroundColor: color,
              }}
            />
            {labelInside && (
              <span
                className="pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 select-none px-1 text-[10px] text-white/90"
                style={{ left: toPercent(leftPct) }}
              >
                {formatDuration(node.durationMs)}
              </span>
            )}
            {!labelInside && (
              <span
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[10px] text-muted-foreground"
                style={
                  hintSide === "right"
                    ? { left: `calc(${toPercent(leftPct + widthPct)} + 4px)` }
                    : { right: `calc(${toPercent(1 - leftPct)} + 4px)` }
                }
              >
                {formatDuration(node.durationMs)}
              </span>
            )}
          </>
        )}

        {node.isInstant && (
          <div
            className="absolute bottom-0 top-0 w-px"
            style={{
              left: toPercent(instantPct),
              backgroundColor: color,
            }}
          />
        )}
      </div>
    </div>
  );
}
