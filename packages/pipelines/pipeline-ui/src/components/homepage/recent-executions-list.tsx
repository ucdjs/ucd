import type { ExecutionStatus } from "@ucdjs/pipelines-executor/types";
import type { ExecutionInfo } from "../../types";
import { Link } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { CheckCircle, Circle, Clock, Loader2, XCircle } from "lucide-react";

export interface RecentExecutionsListProps {
  executions: ExecutionInfo[];
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

export function RecentExecutionsList({ executions }: RecentExecutionsListProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Recent Executions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {executions.length === 0
            ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent executions
                </p>
              )
            : (
                executions.map((execution) => {
                  const config = statusConfig[execution.status];
                  const Icon = config.icon;

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
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg",
                        "hover:bg-muted transition-colors",
                        "text-left",
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", config.bgColor)}>
                        <Icon className={cn("w-4 h-4", config.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">
                            {execution.pipelineName}
                          </span>
                          <span className={cn("text-xs px-1.5 py-0.5 rounded", config.bgColor, config.color)}>
                            {config.label}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {execution.sourceId}
                          {" "}
                          ·
                          {formatRelativeTime(execution.startedAt)}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
        </div>
      </CardContent>
    </Card>
  );
}
