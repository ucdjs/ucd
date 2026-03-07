import { useSuspenseQuery } from "@tanstack/react-query";
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
import { executionsQueryOptions } from "@ucdjs/pipelines-ui";
import { formatDuration, formatTimeAgo } from "#lib/pipeline-executions";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/graphs")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(executionsQueryOptions({
      sourceId: params.sourceId,
      fileId: params.sourceFileId,
      pipelineId: params.pipelineId,
      limit: 50,
    }));
  },
  component: PipelineGraphsPage,
});

function PipelineGraphsPage() {
  const { sourceId, sourceFileId, pipelineId } = Route.useParams();
  const { data } = useSuspenseQuery(executionsQueryOptions({
    sourceId,
    fileId: sourceFileId,
    pipelineId,
    limit: 50,
  }));
  const graphExecutions = data.executions.filter((execution) => execution.hasGraph);

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Execution Graphs</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {graphExecutions.length}
            {" "}
            graphs available
          </p>
        </CardHeader>
        <CardContent>
          {graphExecutions.length === 0
            ? (
                <div className="text-center py-12 text-muted-foreground">
                  No execution graphs available yet.
                </div>
              )
            : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-75">Execution</TableHead>
                      <TableHead>When</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Versions</TableHead>
                      <TableHead className="text-right">Routes</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {graphExecutions.map((execution) => {
                      const routeSummary = execution.summary as { totalRoutes?: number; cached?: number } | null;

                      return (
                        <TableRow key={execution.id} className="group">
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
                        <TableCell className="text-right">
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
                            to="/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId/graph"
                            params={{ sourceId, sourceFileId, pipelineId, executionId: execution.id }}
                            className="text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
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
