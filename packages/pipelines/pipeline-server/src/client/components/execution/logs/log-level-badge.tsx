import type { ExecutionLogItem } from "#shared/schemas/execution";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";

type Level = NonNullable<ExecutionLogItem["level"]>;

const LEVEL_STYLES: Record<Level, string> = {
  debug: "text-muted-foreground",
  info: "text-sky-400",
  warn: "text-yellow-400",
  error: "text-red-400",
};

interface LogLevelBadgeProps {
  level: ExecutionLogItem["level"];
  className?: string;
}

export function LogLevelBadge({ level, className }: LogLevelBadgeProps) {
  return (
    <span className={cn(
      "font-mono text-xs font-medium uppercase w-10 shrink-0 text-center",
      level != null ? LEVEL_STYLES[level] : "text-muted-foreground/40",
      className,
    )}>
      {level ?? "—"}
    </span>
  );
}
