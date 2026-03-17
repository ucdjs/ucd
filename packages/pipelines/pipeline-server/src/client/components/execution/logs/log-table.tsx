import type { ExecutionLogItem } from "#shared/schemas/execution";
import { formatTimestamp } from "#lib/format";
import { cn } from "@ucdjs-internal/shared-ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ucdjs-internal/shared-ui/ui/table";
import { Fragment, useState } from "react";
import { LogLevelBadge } from "./log-level-badge";
import { LogPayloadPanel } from "./log-payload-panel";

const INLINE_PARAM_LIMIT = 40;

const LOG_LEVEL_BAR: Record<string, string> = {
  debug: "bg-muted-foreground/40",
  info: "bg-sky-500",
  warn: "bg-yellow-500",
  error: "bg-red-500",
};

const LOG_LEVEL_ROW: Record<string, string> = {
  warn: "bg-yellow-500/5",
  error: "bg-red-500/5",
};

function formatParam(value: unknown): string {
  if (typeof value === "string") return value;
  const json = JSON.stringify(value);
  return json.length <= INLINE_PARAM_LIMIT ? json : "%O";
}

function buildMessageWithParams(log: ExecutionLogItem): string {
  const message = log.payload?.message ?? log.message;
  const params: string[] = [];

  const extraArgs = log.payload?.args?.slice(1) ?? [];
  for (const arg of extraArgs) {
    params.push(formatParam(arg));
  }

  if (log.payload?.source === "logger" && log.payload.meta) {
    params.push(formatParam(log.payload.meta));
  }

  return params.length > 0 ? `${message} ${params.join(" ")}` : message;
}

export interface ExecutionLogTableProps {
  logs: ExecutionLogItem[];
}

export function ExecutionLogTable({ logs }: ExecutionLogTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const hasLogs = logs.length > 0;

  function handleToggle(logId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(logId) ? next.delete(logId) : next.add(logId);
      return next;
    });
  }

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
              const isExpanded = expandedIds.has(log.id);

              return (
                <Fragment key={log.id}>
                  <TableRow
                    className={cn(
                      "cursor-pointer",
                      log.payload ? LOG_LEVEL_ROW[log.payload.level] : log.stream === "stderr" && "bg-red-500/5",
                      isExpanded && "bg-muted",
                    )}
                    onClick={() => handleToggle(log.id)}
                  >
                    <TableCell>
                      <span className={cn("block h-6 w-1 rounded-full", log.payload ? LOG_LEVEL_BAR[log.payload.level] : log.stream === "stderr" ? "bg-red-500" : "bg-sky-500")} />
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        {log.payload?.level && (
                          <LogLevelBadge level={log.payload.level} className="shrink-0" />
                        )}
                        <span className="line-clamp-1 font-mono text-xs">
                          {buildMessageWithParams(log)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={3} className="p-4">
                        <LogPayloadPanel log={log} />
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
