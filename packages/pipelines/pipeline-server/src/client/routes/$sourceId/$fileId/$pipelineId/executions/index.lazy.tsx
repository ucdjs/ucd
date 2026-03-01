import type { Execution } from "@ucdjs/pipelines-ui/schemas";
import { formatDuration, formatTimeAgo } from "#lib/pipeline-executions";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ucdjs-internal/shared-ui/ui/table";
import { StatusIcon, useExecute } from "@ucdjs/pipelines-ui";
import { Play } from "lucide-react";

export const Route = createLazyFileRoute("/$sourceId/$fileId/$pipelineId/executions/")({
  component: ExecutionsListPage,
});

function ExecutionsListPage() {
  const { sourceId, fileId, pipelineId } = Route.useParams();
  const { executions } = Route.useLoaderData();
  const { result: currentExecution } = useExecute();

  const allExecutions: Execution[] = currentExecution?.executionId
    ? [
        {
          id: currentExecution.executionId,
          pipelineId,
          status: "completed" as const,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          versions: null,
          summary: currentExecution.summary ?? null,
          hasGraph: Boolean(currentExecution.graph),
          error: null,
        },
        ...executions.executions,
      ]
    : executions.executions;

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Executions</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {allExecutions.length}
                {" "}
                total runs
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {allExecutions.length === 0
            ? (
                <div className="text-center py-12">
                  <Play className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No executions yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Execute the pipeline to see results here
                  </p>
                </div>
              )
            : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-25">Status</TableHead>
                      <TableHead className="w-75">ID</TableHead>
                      <TableHead>When</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Versions</TableHead>
                      <TableHead>Routes</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allExecutions.map((execution) => (
                      <TableRow key={execution.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon status={execution.status} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                            {execution.id}
                          </code>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatTimeAgo(execution.startedAt)}
                        </TableCell>
                        <TableCell>
                          {formatDuration(execution.startedAt, execution.completedAt)}
                        </TableCell>
                        <TableCell>
                          {execution.versions
                            ? (
                                <div className="flex gap-1 flex-wrap">
                                  {execution.versions.map((v) => (
                                    <Badge key={v} variant="secondary" className="text-xs">
                                      {v}
                                    </Badge>
                                  ))}
                                </div>
                              )
                            : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                        </TableCell>
                        <TableCell>
                          {execution.summary && "totalRoutes" in execution.summary
                            ? (
                                <span className="text-sm">
                                  {execution.summary.totalRoutes}
                                  <span className="text-muted-foreground">
                                    {" "}
                                    (
                                    {execution.summary.cached}
                                    {" "}
                                    cached)
                                  </span>
                                </span>
                              )
                            : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                        </TableCell>
                        <TableCell>
                          <Link
                            to="/$sourceId/$fileId/$pipelineId/executions/$executionId"
                            params={{ sourceId, fileId, pipelineId, executionId: execution.id }}
                            className="text-primary text-sm font-medium hover:underline"
                          >
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
        </CardContent>
      </Card>
    </div>
  );
}
