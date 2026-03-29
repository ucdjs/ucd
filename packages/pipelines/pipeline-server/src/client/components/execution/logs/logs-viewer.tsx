import type { ExecutionLogItem } from "#shared/schemas/execution";
import { executionLogsQueryOptions } from "#queries/execution";
import { formatBytes } from "#lib/format";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { LogDetails } from "./log-details";
import { LogRow } from "./log-row";

type Level = ExecutionLogItem["level"];
const ALL_LEVELS: Level[] = ["debug", "info", "warn", "error"];

const LEVEL_PILL: Record<Level, string> = {
  debug: "text-muted-foreground hover:bg-muted",
  info: "text-sky-400 hover:bg-sky-400/10",
  warn: "text-yellow-400 hover:bg-yellow-400/10",
  error: "text-red-400 hover:bg-red-400/10",
};

const LEVEL_PILL_ACTIVE: Record<Level, string> = {
  debug: "bg-muted text-foreground",
  info: "bg-sky-400/20 text-sky-400",
  warn: "bg-yellow-400/20 text-yellow-400",
  error: "bg-red-400/20 text-red-400",
};

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

  const [levelFilter, setLevelFilter] = useState<Level | null>(null);
  const [selectedLog, setSelectedLog] = useState<ExecutionLogItem | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isRunning = data.status === "running";

  useEffect(() => {
    if (isRunning && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data.logs, isRunning]);

  const filtered = levelFilter == null
    ? data.logs
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

        {ALL_LEVELS.map((lvl) => (
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
