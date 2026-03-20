import type { ExecutionStatus } from "@ucdjs/pipelines-executor";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";

const STATUS_BADGE_STYLES: Record<string, string> = {
  completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  failed: "border-red-500/25 bg-red-500/10 text-red-300",
  running: "border-amber-500/25 bg-amber-500/10 text-amber-300",
};

export function StatusBadge({ status }: { status: ExecutionStatus }) {
  const className = STATUS_BADGE_STYLES[status] ?? "border-border/70 bg-muted/30 text-foreground";

  switch (status) {
    case "completed":
      return (
        <Badge
          variant="outline"
          className={`h-6 rounded-full border px-2.5 text-xs font-medium ${className}`}
        >
          Success
        </Badge>
      );
    case "failed":
      return (
        <Badge
          variant="outline"
          className={`h-6 rounded-full border px-2.5 text-xs font-medium ${className}`}
        >
          Failed
        </Badge>
      );
    case "running":
      return (
        <Badge
          variant="outline"
          className={`h-6 rounded-full border px-2.5 text-xs font-medium ${className}`}
        >
          Running
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className={`h-6 rounded-full border px-2.5 text-xs font-medium ${className}`}
        >
          {status}
        </Badge>
      );
  }
}
