import { StatusIcon } from "#components/execution/execution-status";
import { executionsQueryOptions } from "#queries/execution";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Play } from "lucide-react";
import { formatExecutionDuration, formatStartedAt } from "../../../../../components/execution/execution-utils";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/executions/")({
  loader: async ({ context, params }) => {
    return {
      executions: await context.queryClient.ensureQueryData(executionsQueryOptions({
        sourceId: params.sourceId,
        fileId: params.sourceFileId,
        pipelineId: params.pipelineId,
        limit: 50,
      })),
    };
  },
  component: ExecutionsListPage,
});

function ExecutionsListPage() {
  const { sourceId, sourceFileId, pipelineId } = Route.useParams();
  const { executions: data } = Route.useLoaderData();

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Executions</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {data.executions.length}
                {" "}
                total runs
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.executions.length === 0
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
                    {data.executions.map((execution) => {
                      const routeSummary = execution.summary as { totalRoutes?: number; cached?: number } | null;

                      return (
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
                            {formatStartedAt(execution.startedAt)}
                          </TableCell>
                          <TableCell>
                            {formatExecutionDuration(execution.startedAt, execution.completedAt)}
                          </TableCell>
                          <TableCell>
                            {execution.versions
                              ? (
                                  <div className="flex gap-1 flex-wrap">
                                    {execution.versions.map((version) => (
                                      <Badge key={version} variant="secondary" className="text-xs">
                                        {version}
                                      </Badge>
                                    ))}
                                  </div>
                                )
                              : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                          </TableCell>
                          <TableCell>
                            {routeSummary?.totalRoutes != null
                              ? (
                                  <span className="text-sm">
                                    {routeSummary.totalRoutes}
                                    <span className="text-muted-foreground">
                                      {" "}
                                      (
                                      {routeSummary.cached ?? 0}
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
                              to="/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId"
                              params={{ sourceId, sourceFileId, pipelineId, executionId: execution.id }}
                              className="text-primary text-sm font-medium hover:underline"
                            >
                              View
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
        </CardContent>
      </Card>
    </div>
  );
}
