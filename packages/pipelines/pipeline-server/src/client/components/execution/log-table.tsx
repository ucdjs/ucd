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

const LOG_LEVEL_STYLES: Record<string, string> = {
  debug: "bg-muted text-muted-foreground",
  info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  warn: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  error: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function ExecutionLogPayloadPanel({ log }: { log: ExecutionLogItem | null }) {
  if (!log) return null;

  const payload = log.payload ?? { message: log.message, stream: log.stream };
  const { meta, args, event, level, source, ...rest } = payload;
  const jsonString = JSON.stringify(rest, null, 2);

  return (
    <div className="border border-border rounded-lg bg-background p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {level && (
          <Badge variant="outline" className={cn("text-xs font-mono", LOG_LEVEL_STYLES[level])}>
            {level}
          </Badge>
        )}
        {source && (
          <Badge variant="outline" className="text-xs font-mono">
            {source}
          </Badge>
        )}
        {event && (
          <Badge variant="outline" className="text-xs">
            {event.type}
          </Badge>
        )}
      </div>

      {meta && Object.keys(meta).length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-1">meta</div>
          <pre className="text-xs font-mono whitespace-pre-wrap wrap-break-word bg-muted/40 rounded p-2">
            <code>{JSON.stringify(meta, null, 2)}</code>
          </pre>
        </div>
      )}

      {args && args.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-1">args</div>
          <pre className="text-xs font-mono whitespace-pre-wrap wrap-break-word bg-muted/40 rounded p-2">
            <code>{JSON.stringify(args, null, 2)}</code>
          </pre>
        </div>
      )}

      <div>
        <div className="text-xs text-muted-foreground mb-1">payload</div>
        <pre className="text-xs font-mono whitespace-pre-wrap wrap-break-word bg-muted/40 rounded p-2">
          <code>{jsonString}</code>
        </pre>
      </div>
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
                      <div className="flex items-center gap-2">
                        {log.payload?.level && (
                          <Badge
                            variant="outline"
                            className={cn("text-xs font-mono shrink-0", LOG_LEVEL_STYLES[log.payload.level])}
                          >
                            {log.payload.level}
                          </Badge>
                        )}
                        <span className="line-clamp-1">
                          {log.payload?.message ?? log.message}
                        </span>
                      </div>
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
