import type { Execution } from "#lib/pipeline-executions";
import { formatDuration, formatTimeAgo } from "#lib/pipeline-executions";
import { Link, useParams } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";

interface RecentOutputsPanelProps {
  executions: Execution[];
}

export function RecentOutputsPanel({ executions }: RecentOutputsPanelProps) {
  const { file, id: pipelineId } = useParams({ from: "/pipelines/$file/$id" });
  const recentExecutions = executions.slice(0, 6);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Recent Outputs</CardTitle>
            <CardDescription>
              Latest execution outputs summary
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
                No outputs yet. Run the pipeline to produce results.
              </div>
            )
          : (
              <div className="space-y-2">
                {recentExecutions.map((execution) => (
                  <div
                    key={execution.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground truncate">
                          {execution.id}
                        </span>
                        {execution.summary?.totalRoutes != null && (
                          <Badge variant="secondary" className="text-[10px]">
                            {execution.summary.totalRoutes}
                            {" "}
                            routes
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(execution.startedAt)}
                        {" "}
                        •
                        {" "}
                        {formatDuration(execution.startedAt, execution.completedAt)}
                      </div>
                    </div>
                    <Link
                      to="/pipelines/$file/$id/executions/$executionId"
                      params={{ file, id: pipelineId, executionId: execution.id }}
                      className="text-xs text-primary hover:underline shrink-0 ml-4"
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
