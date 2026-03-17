import { cn } from "@ucdjs-internal/shared-ui";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";

const LOG_LEVEL_STYLES: Record<string, string> = {
  debug: "bg-muted text-muted-foreground",
  info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  warn: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  error: "bg-red-500/10 text-red-600 dark:text-red-400",
};

interface LogLevelBadgeProps {
  level: string;
  className?: string;
}

export function LogLevelBadge({ level, className }: LogLevelBadgeProps) {
  return (
    <Badge variant="outline" className={cn("text-xs font-mono", LOG_LEVEL_STYLES[level], className)}>
      {level}
    </Badge>
  );
}
