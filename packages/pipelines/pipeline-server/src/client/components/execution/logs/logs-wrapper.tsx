import { formatBytes } from "#lib/format";
import { executionLogsQueryOptions } from "#queries/execution";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ExecutionLogTable } from "./log-table";

export interface ExecutionLogsViewerProps {
  sourceId: string;
  sourceFileId: string;
  pipelineId: string;
  executionId: string;
  selectedSpanId: string | null;
}

export function ExecutionLogsViewer({ sourceId, sourceFileId, pipelineId, executionId, selectedSpanId }: ExecutionLogsViewerProps) {
  const { data: logsData } = useSuspenseQuery(executionLogsQueryOptions({
    sourceId,
    fileId: sourceFileId,
    pipelineId,
    executionId,
    limit: 500,
  }));

  const filteredLogs = useMemo(() => {
    const logs = logsData.logs.filter((log) => !log.payload?.isBanner);
    if (!selectedSpanId) return logs;
    return logs.filter((log) => log.spanId === selectedSpanId);
  }, [logsData.logs, selectedSpanId]);

  return (
    <>
      {logsData.truncated && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-300">
          <span className="shrink-0 font-semibold">Logs truncated</span>
          <span className="text-amber-700 dark:text-amber-400">
            Captured
            {" "}
            {formatBytes(logsData.capturedSize)}
            {" "}
            of
            {" "}
            {formatBytes(logsData.originalSize)}
            {" "}
            — some log entries were dropped.
          </span>
        </div>
      )}
      <ExecutionLogTable logs={filteredLogs} />
    </>
  );
}
