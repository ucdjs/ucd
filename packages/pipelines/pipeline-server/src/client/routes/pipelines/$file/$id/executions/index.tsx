import type { Execution } from "#lib/pipeline-executions";
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
import { useExecute } from "@ucdjs/pipelines-ui";
import { CheckCircle2, Circle, Clock, Play, XCircle } from "lucide-react";

function StatusIcon({ status }: { status: Execution["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "running":
      return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
    default:
      return <Circle className="h-4 w-4 text-gray-400" />;
  }
}

function StatusBadge({ status }: { status: Execution["status"] }) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Success
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Failed
        </Badge>
      );
    case "running":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Running
        </Badge>
      );
  }
}

export const Route = createFileRoute("/pipelines/$file/$id/executions/")({
  component: ExecutionsListPage,
  loader: async ({ params }) => {
    const executions = await fetchExecutions(params.file, params.id, { limit: 50 });
    return { executions };
  },
});

function ExecutionsListPage() {
  const { file, id: pipelineId } = Route.useParams();
  const { executions } = Route.useLoaderData();
  const { result: currentExecution } = useExecute();

  const allExecutions = currentExecution?.executionId
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
                      <TableHead className="text-right">Routes</TableHead>
                      <TableHead className="text-right">Graph</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allExecutions.map((execution) => (
                      <TableRow key={execution.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon status={execution.status} />
                            <StatusBadge status={execution.status} />
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
                        <TableCell className="text-right">
                          {execution.hasGraph
                            ? (
                                <Badge variant="secondary" className="text-xs">
                                  Graph
                                </Badge>
                              )
                            : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                        </TableCell>
                        <TableCell>
                          <Link
                            to="/pipelines/$file/$id/executions/$executionId"
                            params={{ file, id: pipelineId, executionId: execution.id }}
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
