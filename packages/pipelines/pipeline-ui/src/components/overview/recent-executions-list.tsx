import type { ExecutionStatus } from "@ucdjs/pipelines-executor/types";
import type { ExecutionInfo } from "../../types";
import { Link } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { CardContent } from "@ucdjs-internal/shared-ui/ui/card";
import { CheckCircle, Circle, Clock, Loader2, XCircle } from "lucide-react";

export interface RecentExecutionsListProps {
  executions: ExecutionInfo[];
  maxItems?: number;
  contentClassName?: string;
  dense?: boolean;
  showStatusLabel?: boolean;
  listClassName?: string;
  compactMeta?: boolean;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    label: "Pending",
  },
  running: {
    icon: Loader2,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    label: "Running",
  },
  completed: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
    label: "Completed",
  },
  failed: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    label: "Failed",
  },
  cancelled: {
    icon: Circle,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    label: "Cancelled",
  },
} as const satisfies Record<ExecutionStatus, { icon: typeof CheckCircle; color: string; bgColor: string; label: string }>;

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecentExecutionsList({
  executions,
  maxItems,
  contentClassName,
  dense = false,
  showStatusLabel = true,
  listClassName,
  compactMeta = false,
}: RecentExecutionsListProps) {
  const items = maxItems ? executions.slice(0, maxItems) : executions;
  const iconWrapClass = dense ? "w-7 h-7" : "w-8 h-8";
  const iconClass = dense ? "w-3.5 h-3.5" : "w-4 h-4";
  const rowPaddingClass = dense ? "p-2" : "p-3";
  const listSpacingClass = dense ? "divide-y divide-border/60" : "space-y-2";

  return (
    <CardContent className={contentClassName}>
      <div className={cn(listSpacingClass, listClassName)}>
        {items.length === 0
          ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent executions
              </p>
            )
          : (
              items.map((execution) => {
                const config = statusConfig[execution.status];
                const Icon = config.icon;
                const hasRoute = Boolean(execution.sourceId && execution.fileId);
                const timestamp = formatRelativeTime(execution.startedAt);
                const metaLabel = execution.sourceId ? `${execution.sourceId} · ${timestamp}` : timestamp;
                const rowClassName = cn(
                  "w-full flex items-center gap-3 rounded-lg",
                  "hover:bg-muted transition-colors",
                  "text-left",
                  rowPaddingClass,
                );

                const content = (
                  <>
                    <div className={cn("rounded-full flex items-center justify-center shrink-0", iconWrapClass, config.bgColor)}>
                      <Icon className={cn(iconClass, config.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={cn("flex items-center gap-2", compactMeta && "justify-between")}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-foreground truncate">
                            {execution.pipelineName}
                          </span>
                          {showStatusLabel && (
                            <span className={cn("text-xs px-1.5 py-0.5 rounded", config.bgColor, config.color)}>
                              {config.label}
                            </span>
                          )}
                        </div>
                        {compactMeta && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {metaLabel}
                          </span>
                        )}
                      </div>
                      {!compactMeta && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {metaLabel}
                        </div>
                      )}
                    </div>
                  </>
                );

                if (!hasRoute) {
                  return (
                    <div key={execution.id} className={rowClassName}>
                      {content}
                    </div>
                  );
                }

                return (
                  <Link
                    key={execution.id}
                    to="/$sourceId/$fileId/$pipelineId/executions/$executionId"
                    params={{
                      sourceId: execution.sourceId,
                      fileId: execution.fileId,
                      pipelineId: execution.pipelineId,
                      executionId: execution.id,
                    }}
                    className={rowClassName}
                  >
                    {content}
                  </Link>
                );
              })
            )}
      </div>
    </CardContent>
  );
}
