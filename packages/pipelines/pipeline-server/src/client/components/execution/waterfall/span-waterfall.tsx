import type { ViewRange, WaterfallNode } from "#lib/waterfall";
import { clamp, getSpanColor, toPercent } from "#lib/waterfall";
import { useEffect, useRef, useState } from "react";

const CANVAS_HEIGHT = 60;
const MIN_RANGE = 0.02;

type DragMode = "reframe" | "scrubStart" | "scrubEnd";

interface DragState {
  mode: DragMode;
  startX: number;
  containerWidth: number;
  anchorStart: number;
  anchorEnd: number;
}

interface SpanWaterfallProps {
  nodes: WaterfallNode[];
  totalDurationMs: number;
  viewRange: ViewRange;
  onViewRangeChange: (range: ViewRange) => void;
}

export function SpanWaterfall({
  nodes,
  totalDurationMs,
  viewRange,
  onViewRangeChange,
}: SpanWaterfallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const [canvasWidth, setCanvasWidth] = useState(0);
  const [liveRange, setLiveRange] = useState<ViewRange>(viewRange);
  const [cursorPct, setCursorPct] = useState<number | null>(null);
  const [dragMode, setDragMode] = useState<DragMode | null>(null);

  // Always-current ref so event handlers never see a stale liveRange
  const liveRangeRef = useRef<ViewRange>(liveRange);
  liveRangeRef.current = liveRange;

  // Sync when the parent resets viewRange externally
  useEffect(() => {
    setLiveRange(viewRange);
  }, [viewRange]);

  // Observe container width changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setCanvasWidth(entry.contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Draw spans onto the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasWidth === 0 || totalDurationMs === 0 || nodes.length === 0) return;

    const dpr = window.devicePixelRatio ?? 1;
    canvas.width = Math.floor(canvasWidth * dpr);
    canvas.height = Math.floor(CANVAS_HEIGHT * dpr);
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvasWidth, CANVAS_HEIGHT);

    const rowH = Math.min(4, Math.max(1, Math.floor(CANVAS_HEIGHT / nodes.length)));

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]!;
      const x = (node.startMs / totalDurationMs) * canvasWidth;
      const w = node.isInstant
        ? 1
        : Math.max(1, (node.durationMs / totalDurationMs) * canvasWidth);
      ctx.fillStyle = getSpanColor(node.kind);
      ctx.fillRect(x, i * rowH, w, rowH);
    }
  }, [nodes, totalDurationMs, canvasWidth]);

  // Global mouse listeners - always attached, check dragStateRef to decide
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const state = dragStateRef.current;
      if (!state) return;

      const delta = (e.clientX - state.startX) / state.containerWidth;
      const windowSize = state.anchorEnd - state.anchorStart;

      if (state.mode === "reframe") {
        const newStart = clamp(state.anchorStart + delta, 0, 1 - windowSize);
        setLiveRange({ start: newStart, end: newStart + windowSize });
      } else if (state.mode === "scrubStart") {
        const newStart = clamp(state.anchorStart + delta, 0, state.anchorEnd - MIN_RANGE);
        setLiveRange({ start: newStart, end: state.anchorEnd });
      } else {
        const newEnd = clamp(state.anchorEnd + delta, state.anchorStart + MIN_RANGE, 1);
        setLiveRange({ start: state.anchorStart, end: newEnd });
      }
    };

    const handleMouseUp = () => {
      if (!dragStateRef.current) return;
      dragStateRef.current = null;
      setDragMode(null);
      onViewRangeChange(liveRangeRef.current);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onViewRangeChange]);

  // Apply cursor + text-selection lock to body during drag
  useEffect(() => {
    if (dragMode === null) {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    } else if (dragMode === "reframe") {
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragMode]);

  function startDrag(e: React.MouseEvent, mode: DragMode) {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    dragStateRef.current = {
      mode,
      startX: e.clientX,
      containerWidth: rect.width,
      anchorStart: liveRangeRef.current.start,
      anchorEnd: liveRangeRef.current.end,
    };
    setDragMode(mode);
  }

  const showCursor = cursorPct !== null && dragMode !== "scrubStart" && dragMode !== "scrubEnd";
  const isZoomed = liveRange.start !== 0 || liveRange.end !== 1;

  return (
    <div
      ref={containerRef}
      className="relative shrink-0 select-none border-b bg-muted/20"
      style={{ height: CANVAS_HEIGHT }}
      onMouseMove={(e) => {
        if (dragStateRef.current) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) setCursorPct((e.clientX - rect.left) / rect.width);
      }}
      onMouseLeave={() => setCursorPct(null)}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Left inactive overlay */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 bg-background/60"
        style={{ width: toPercent(liveRange.start) }}
      />

      {/* Right inactive overlay */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 bg-background/60"
        style={{ width: toPercent(1 - liveRange.end) }}
      />

      {/* Reframe drag area (the active window between scrubbers) */}
      <div
        className="absolute inset-y-0 z-10 cursor-grab"
        style={{
          left: toPercent(liveRange.start),
          width: toPercent(liveRange.end - liveRange.start),
        }}
        onMouseDown={(e) => startDrag(e, "reframe")}
      />

      {/* Left scrubber */}
      <div
        className="absolute inset-y-0 z-20 cursor-ew-resize"
        style={{
          left: `calc(${toPercent(liveRange.start)} - 6px)`,
          width: "12px",
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          startDrag(e, "scrubStart");
        }}
      >
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-primary" />
      </div>

      {/* Right scrubber */}
      <div
        className="absolute inset-y-0 z-20 cursor-ew-resize"
        style={{
          left: `calc(${toPercent(liveRange.end)} - 6px)`,
          width: "12px",
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          startDrag(e, "scrubEnd");
        }}
      >
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-primary" />
      </div>

      {/* Cursor hairline */}
      {showCursor && cursorPct !== null && (
        <div
          className="pointer-events-none absolute inset-y-0 z-30 w-px bg-foreground/40"
          style={{ left: toPercent(cursorPct) }}
        />
      )}

      {/* Reset zoom button */}
      {isZoomed && (
        <button
          type="button"
          className="absolute right-2 top-1/2 z-30 -translate-y-1/2 rounded bg-background/80 px-2 py-0.5 text-xs text-foreground hover:bg-background"
          onClick={() => {
            const full: ViewRange = { start: 0, end: 1 };
            setLiveRange(full);
            onViewRangeChange(full);
          }}
        >
          Reset zoom
        </button>
      )}
    </div>
  );
}
