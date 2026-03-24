import type { ExecutionSummaryItem } from "#queries/execution";
import { StatusBadge } from "#components/execution/status-badge";
import { formatExecutionDuration, formatStartedAt } from "#lib/format";
import { Link, useParams } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Boxes, ChartSpline, Clock3, Database, History, Layers3, Route as RouteIcon } from "lucide-react";

export interface LatestExecutionProps {
  latestExecution: ExecutionSummaryItem | null;
  latestGraphExecution?: ExecutionSummaryItem | null;
}

export function LatestExecution({
  latestExecution,
  latestGraphExecution,
}: LatestExecutionProps) {
  const { sourceId, sourceFileId, pipelineId } = useParams({ from: "/s/$sourceId/$sourceFileId/$pipelineId" });

  return (
    <Card className="xl:col-span-7 2xl:col-span-10">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Latest execution</CardTitle>
          {latestExecution && (
            <div className="flex flex-wrap gap-2">
              <Button
                nativeButton={false}
                variant="outline"
                size="sm"
                render={(props) => (
                  <Link
                    to="/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId"
                    params={{
                      sourceId,
                      sourceFileId,
                      pipelineId,
                      executionId: latestExecution.id,
                    }}
                    {...props}
                  >
                    <History className="h-3.5 w-3.5" />
                    Execution
                  </Link>
                )}
              />
              {(latestGraphExecution ?? latestExecution).hasGraph && (
                <Button
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  render={(props) => (
                    <Link
                      to="/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId/graph"
                      params={{
                        sourceId,
                        sourceFileId,
                        pipelineId,
                        executionId: (latestGraphExecution ?? latestExecution).id,
                      }}
                      {...props}
                    >
                      <ChartSpline className="h-3.5 w-3.5" />
                      Graph
                    </Link>
                  )}
                />
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        {latestExecution
          ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{latestExecution.id}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Started
                      {" "}
                      {formatStartedAt(latestExecution.startedAt)}
                    </div>
                  </div>
                  <StatusBadge status={latestExecution.status} />
                </div>

                <div className="grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      Duration
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {formatExecutionDuration(latestExecution.startedAt, latestExecution.completedAt)}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      <Layers3 className="h-3.5 w-3.5" />
                      Versions
                    </div>
                    {latestExecution.versions && latestExecution.versions.length > 0
                      ? (
                          <div className="flex flex-wrap gap-1.5">
                            {latestExecution.versions.map((version) => (
                              <Badge key={version} variant="secondary" className="text-xs">
                                {version}
                              </Badge>
                            ))}
                          </div>
                        )
                      : <div className="text-sm text-muted-foreground">No versions</div>}
                  </div>
                </div>

                {latestExecution.summary && (
                  <div className="grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-3">
                    <div>
                      <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        <RouteIcon className="h-3.5 w-3.5" />
                        Routes
                      </div>
                      <div className="mt-1 text-sm font-medium text-foreground">{latestExecution.summary.totalRoutes}</div>
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        <Database className="h-3.5 w-3.5" />
                        Cached
                      </div>
                      <div className="mt-1 text-sm font-medium text-foreground">{latestExecution.summary.cached}</div>
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        <Boxes className="h-3.5 w-3.5" />
                        Outputs
                      </div>
                      <div className="mt-1 text-sm font-medium text-foreground">{latestExecution.summary.totalOutputs}</div>
                    </div>
                  </div>
                )}
              </div>
            )
          : (
              <div className="flex min-h-40 items-center justify-center text-center text-lg font-medium text-muted-foreground">
                No executions
              </div>
            )}
      </CardContent>
    </Card>
  );
}
