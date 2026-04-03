import type { ExecutionStatus } from "@ucdjs/pipeline-executor";
import { Badge } from "@ucdjs-internal/shared-ui/components";

const STATUS_BADGE_STYLES: Record<string, string> = {
  completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  failed: "border-red-500/25 bg-red-500/10 text-red-300",
  running: "border-amber-500/25 bg-amber-500/10 text-amber-300",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Success",
  failed: "Failed",
  running: "Running",
};

export function StatusBadge({ status }: { status: ExecutionStatus }) {
  const className = STATUS_BADGE_STYLES[status] ?? "border-border/70 bg-muted/30 text-foreground";

  return (
    <Badge
      variant="outline"
      className={`h-6 rounded-full border px-2.5 text-xs font-medium ${className}`}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
