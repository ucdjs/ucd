import type { ExecutionLogItem } from "#shared/schemas/execution";
import type { FilterLevel } from "./log-level-styles";
import { formatBytes } from "#lib/format";
import { executionLogsQueryOptions } from "#queries/execution";
import { useSuspenseQuery } from "@tanstack/react-query";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { useEffect, useRef, useState } from "react";
import { LogDetails } from "./log-details";
import { LEVEL_PILL, LEVEL_PILL_ACTIVE } from "./log-level-styles";
import { LogRow } from "./log-row";

type Level = NonNullable<ExecutionLogItem["level"]>;
const KNOWN_LEVELS: Level[] = ["debug", "info", "warn", "error"];

interface LogsViewerProps {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  executionId: string;
  selectedSpanId: string | null;
  onClearSpan?: () => void;
}

export function LogsViewer({
  sourceId,
  fileId,
  pipelineId,
  executionId,
  selectedSpanId,
  onClearSpan,
}: LogsViewerProps) {
  const { data } = useSuspenseQuery(executionLogsQueryOptions({
    sourceId,
    fileId,
    pipelineId,
    executionId,
    spanId: selectedSpanId ?? undefined,
    limit: 500,
  }));

  const [levelFilter, setLevelFilter] = useState<FilterLevel | null>(null);
  const [selectedLog, setSelectedLog] = useState<ExecutionLogItem | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isRunning = data.status === "running";
  const hasUnknownLevel = data.logs.some((l) => l.level == null);

  useEffect(() => {
    if (isRunning && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data.logs, isRunning]);

  const filtered = levelFilter == null
    ? data.logs
    : levelFilter === "unknown"
      ? data.logs.filter((l) => l.level == null)
      : data.logs.filter((l) => l.level === levelFilter);

  return (
    <div className="flex h-full flex-col overflow-hidden font-mono text-xs">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-1.5">
        <button
          type="button"
          onClick={() => setLevelFilter(null)}
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium transition-colors",
            levelFilter === null
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          All
        </button>

        {KNOWN_LEVELS.map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => setLevelFilter(levelFilter === lvl ? null : lvl)}
            className={cn(
              "rounded px-2 py-0.5 text-xs font-medium uppercase transition-colors",
              levelFilter === lvl ? LEVEL_PILL_ACTIVE[lvl] : LEVEL_PILL[lvl],
            )}
          >
            {lvl}
          </button>
        ))}

        {hasUnknownLevel && (
          <button
            type="button"
            onClick={() => setLevelFilter(levelFilter === "unknown" ? null : "unknown")}
            className={cn(
              "rounded px-2 py-0.5 text-xs font-medium transition-colors",
              levelFilter === "unknown" ? LEVEL_PILL_ACTIVE.unknown : LEVEL_PILL.unknown,
            )}
          >
            Unknown
          </button>
        )}

        {selectedSpanId != null && (
          <div className="flex items-center gap-1 rounded border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
            <span>Filtered by span</span>
            <button
              type="button"
              onClick={onClearSpan}
              className="ml-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear span filter"
            >
              ×
            </button>
          </div>
        )}

        <span className="ml-auto text-muted-foreground">
          {filtered.length}
          {" "}
          {filtered.length === 1 ? "log" : "logs"}
        </span>
      </div>

      {/* Column headers */}
      <div className="flex shrink-0 items-center border-b bg-muted/30 text-xs text-muted-foreground">
        <div className="w-20 shrink-0 py-1 pl-3">Level</div>
        <div className="w-28 shrink-0 py-1">Timestamp</div>
        <div className="w-20 shrink-0 py-1">Source</div>
        <div className="min-w-0 flex-1 py-1 pr-3">Message</div>
      </div>

      {/* Log list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="p-4 text-muted-foreground">
            {selectedSpanId != null ? "No logs for this span." : "No logs yet."}
          </p>
        )}
        {filtered.map((log) => (
          <LogRow key={log.id} log={log} onSelect={() => setSelectedLog(log)} />
        ))}
      </div>

      <LogDetails log={selectedLog} onClose={() => setSelectedLog(null)} />

      {/* Footer */}
      {data.truncated && (
        <div className="shrink-0 border-t bg-yellow-400/10 px-3 py-1 text-xs text-yellow-400">
          ⚠ Output truncated — showing
          {" "}
          {formatBytes(data.capturedSize)}
          {data.originalSize != null ? ` of ${formatBytes(data.originalSize)}` : ""}
        </div>
      )}
    </div>
  );
}
