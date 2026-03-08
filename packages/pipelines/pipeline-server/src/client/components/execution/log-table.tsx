import type { ExecutionLogItem } from "#shared/types";
import { formatTimestamp } from "#lib/format";
import { cn } from "@ucdjs-internal/shared-ui";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ucdjs-internal/shared-ui/ui/table";
import { Fragment } from "react";

export interface ExecutionLogTableProps {
  logs: ExecutionLogItem[];
  expandedLogId: string | null;
  onToggle: (logId: string) => void;
}

function getStreamAccent(stream: ExecutionLogItem["stream"]): string {
  return stream === "stderr" ? "bg-red-500" : "bg-sky-500";
}

function ExecutionLogPayloadPanel({ log }: { log: ExecutionLogItem | null }) {
  if (!log) return null;

  const payload = log.payload ?? { message: log.message, stream: log.stream };
  const jsonString = JSON.stringify(payload, null, 2);

  return (
    <div className="border border-border rounded-lg bg-background p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium">Payload</div>
        {payload.event && (
          <Badge variant="outline" className="text-xs">
            {payload.event.type}
          </Badge>
        )}
      </div>
      <pre className="text-xs font-mono whitespace-pre-wrap break-words">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
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
