import type { ExecutionSummaryItem } from "../../functions/executions";
import { formatExecutionDuration, formatStartedAt } from "../../lib/execution-time";
import { Link, useParams } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Play } from "lucide-react";
import { StatusIcon } from "../status-icon";

interface RecentExecutionsCardProps {
  executions: ExecutionSummaryItem[];
}

export function RecentExecutionsCard({
  executions,
}: RecentExecutionsCardProps) {
  const params = useParams({ strict: false });
  const sourceId = "sourceId" in params && typeof params.sourceId === "string" ? params.sourceId : "";
  const sourceFileId = "sourceFileId" in params && typeof params.sourceFileId === "string" ? params.sourceFileId : "";
  const pipelineId = "pipelineId" in params && typeof params.pipelineId === "string" ? params.pipelineId : "";

  return (
    <Card className="xl:col-span-8">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Recent executions</CardTitle>
            <CardDescription>
              Latest runs for this pipeline
            </CardDescription>
          </div>
          <Link
            to="/s/$sourceId/$sourceFileId/$pipelineId/executions"
            params={{ sourceId, sourceFileId, pipelineId }}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {executions.length === 0
          ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
                <Play className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">No executions yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Run the pipeline to build up execution history.
                </p>
              </div>
            )
          : (
              <div className="space-y-3">
                {executions.map((execution) => (
                  <div
                    key={execution.id}
                    className="grid gap-3 rounded-xl border border-border bg-card px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-3">
                        <StatusIcon status={execution.status} />
                        <code className="truncate text-xs font-medium">{execution.id}</code>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatStartedAt(execution.startedAt)}</span>
                        <span>•</span>
                        <span>{formatExecutionDuration(execution.startedAt, execution.completedAt)}</span>
                        {execution.versions && execution.versions.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{execution.versions.join(", ")}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-start md:justify-end">
                      <Link
                        to="/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId"
                        params={{ sourceId, sourceFileId, pipelineId, executionId: execution.id }}
                        className="shrink-0 text-sm font-medium text-primary hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </CardContent>
    </Card>
  );
}
