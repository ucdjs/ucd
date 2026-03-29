import type { ExecutionLogItem } from "#shared/schemas/execution";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { LEVEL_COLOR } from "./log-level-styles";

interface LogLevelBadgeProps {
  level: ExecutionLogItem["level"];
  className?: string;
}

export function LogLevelBadge({ level, className }: LogLevelBadgeProps) {
  return (
    <span className={cn(
      "font-mono text-xs font-medium uppercase w-10 shrink-0 text-center",
      level != null ? LEVEL_COLOR[level] : "text-muted-foreground/40",
      className,
    )}
    >
      {level ?? "—"}
    </span>
  );
}
