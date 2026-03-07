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

function formatExecutionDuration(startedAt: string, completedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const durationMs = end - start;

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  if (durationMs < 60_000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  }

  return `${Math.floor(durationMs / 60_000)}m ${Math.floor((durationMs % 60_000) / 1000)}s`;
}

function formatStartedAt(timestamp: string): string {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

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
