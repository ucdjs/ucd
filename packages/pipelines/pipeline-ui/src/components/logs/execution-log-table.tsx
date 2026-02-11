import type { ExecutionLogItem } from "../../types";
import { formatTimestamp } from "#lib/execution-logs";
import { cn } from "#lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ucdjs-internal/shared-ui/ui/table";
import { Fragment } from "react";
import { ExecutionLogPayloadPanel } from "./execution-log-payload";

export interface ExecutionLogTableProps {
  logs: ExecutionLogItem[];
  expandedLogId: string | null;
  onToggle: (logId: string) => void;
}

function getStreamAccent(stream: ExecutionLogItem["stream"]): string {
  return stream === "stderr" ? "bg-red-500" : "bg-sky-500";
}

export function ExecutionLogTable({ logs, expandedLogId, onToggle }: ExecutionLogTableProps) {
  const hasLogs = logs.length > 0;

  return (
    <div>
      <div
        className={cn(
          "border border-dashed border-border rounded-lg p-6 text-sm text-muted-foreground",
          hasLogs && "hidden",
        )}
      >
        No logs captured for this execution.
      </div>
      <div className={cn("border border-border rounded-lg overflow-hidden", !hasLogs && "hidden")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-6"></TableHead>
              <TableHead className="w-56">Timestamp</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;

              return (
                <Fragment key={log.id}>
                  <TableRow
                    className={cn(
                      "cursor-pointer",
                      log.stream === "stderr" && "bg-red-500/5",
                      isExpanded && "bg-muted",
                    )}
                    onClick={() => onToggle(log.id)}
                  >
                    <TableCell>
                      <span className={cn("block h-6 w-1 rounded-full", getStreamAccent(log.stream))} />
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="line-clamp-1">
                        {log.payload?.message ?? log.message}
                      </span>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={3} className="p-4">
                        <ExecutionLogPayloadPanel log={log} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
