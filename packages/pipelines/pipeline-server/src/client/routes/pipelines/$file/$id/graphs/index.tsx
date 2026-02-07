import type { Execution, ExecutionsResponse } from "#lib/pipeline-executions";
import { fetchExecutions, formatDuration, formatTimeAgo } from "#lib/pipeline-executions";
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

export const Route = createFileRoute("/pipelines/$file/$id/graphs/")({
  component: PipelineGraphsPage,
  loader: async ({ params }) => {
    const executions = await fetchExecutions(params.file, params.id, { limit: 50 });
    return { executions } satisfies { executions: ExecutionsResponse };
  },
});

function PipelineGraphsPage() {
  const { file, id } = Route.useParams();
  const { executions } = Route.useLoaderData();

  const graphExecutions = executions.executions.filter((execution: Execution) => execution.hasGraph);

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
                    {graphExecutions.map((execution: Execution) => (
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
                                  {execution.versions.map((v: string) => (
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
                        <TableCell className="text-right">
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
                            to="/pipelines/$file/$id/executions/$executionId/graph"
                            params={{ file, id, executionId: execution.id }}
                            search={{}}
                            className="text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
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
