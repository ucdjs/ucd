import type { Execution } from "#lib/pipeline-executions";
import { formatDuration, formatTimeAgo } from "#lib/pipeline-executions";
import { Link, useParams } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ucdjs-internal/shared-ui/ui/card";
import { Play } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { StatusIcon } from "./status-icon";

interface RecentExecutionsPanelProps {
  executions: Execution[];
}

export function RecentExecutionsPanel({ executions }: RecentExecutionsPanelProps) {
  const { id: pipelineId, file } = useParams({ from: "/pipelines/$file/$id" });
  const recentExecutions = executions.slice(0, 10);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Recent Executions</CardTitle>
            <CardDescription>
              Last
              {" "}
              {recentExecutions.length}
              {" "}
              pipeline runs
            </CardDescription>
          </div>
          <Link
            to="/pipelines/$file/$id/executions"
            params={{ file, id: pipelineId }}
            className="text-xs text-primary hover:underline"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {recentExecutions.length === 0
          ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
                <div className="text-center">
                  <Play className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p>No executions yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Execute the pipeline to see results
                  </p>
                </div>
              </div>
            )
          : (
              <div className="space-y-2">
                {recentExecutions.map((execution) => (
                  <div
                    key={execution.id}
                    className="flex items-center justify-between p-3 rounded-md border border-border hover:border-primary/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusIcon status={execution.status} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium truncate">
                            {execution.id}
                          </span>
                          <StatusBadge status={execution.status} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatTimeAgo(execution.startedAt)}</span>
                          <span>•</span>
                          <span>{formatDuration(execution.startedAt, execution.completedAt)}</span>
                          {execution.versions && execution.versions.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{execution.versions.join(", ")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link
                      to="/pipelines/$file/$id/executions/$executionId"
                      params={{ file, id: pipelineId, executionId: execution.id }}
                      className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:underline shrink-0 ml-4"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
      </CardContent>
    </Card>
  );
}
