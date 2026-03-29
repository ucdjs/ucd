import type { ExecutionLogItem } from "#shared/schemas/execution";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { LogLevelBadge } from "./log-level-badge";

type Level = NonNullable<ExecutionLogItem["level"]>;

const LEVEL_BORDER: Record<Level, string> = {
  debug: "bg-muted-foreground/40",
  info: "bg-sky-400",
  warn: "bg-yellow-400",
  error: "bg-red-400",
};

function formatLogTimestamp(timestamp: string): string {
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

interface LogRowProps {
  log: ExecutionLogItem;
  onSelect?: () => void;
}

export function LogRow({ log, onSelect }: LogRowProps) {
  return (
    <div
      className={cn(
        "group flex min-w-0 items-center border-b border-border/40 hover:bg-muted/30",
        onSelect && "cursor-pointer",
      )}
      onClick={onSelect}
    >
      {/* Level border + badge */}
      <div className="flex w-20 shrink-0 items-center gap-1.5 py-1.5 pl-0">
        <div className={cn("h-full w-0.5 self-stretch", log.level != null ? LEVEL_BORDER[log.level] : "bg-border")} />
        <LogLevelBadge level={log.level} />
      </div>

      {/* Timestamp */}
      <div className="w-28 shrink-0 py-1.5 font-mono text-xs text-muted-foreground tabular-nums">
        {formatLogTimestamp(log.timestamp)}
      </div>

      {/* Source */}
      <div className="w-20 shrink-0 py-1.5">
        {(log.source === "console" || log.source === "stdio") && (
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            {log.source}
          </span>
        )}
      </div>

      {/* Message */}
      <div className="min-w-0 flex-1 truncate py-1.5 pr-3 font-mono text-xs">
        {log.message}
      </div>
    </div>
  );
}
