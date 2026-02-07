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

interface Execution {
  id: string;
  pipelineId: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt: string | null;
  versions: string[] | null;
  summary: {
    totalRoutes: number;
    cached: number;
  } | null;
  error: string | null;
}

interface ExecutionsResponse {
  executions: Execution[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

async function fetchExecutions(pipelineId: string): Promise<ExecutionsResponse> {
  const response = await fetch(`/api/pipelines/${pipelineId}/executions?limit=50`);
  if (!response.ok) {
    throw new Error("Failed to fetch executions");
  }
  return response.json();
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const durationMs = end - start;

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  } else if (durationMs < 60000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  } else {
    return `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`;
  }
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
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

export const Route = createFileRoute("/pipelines/$id/executions/")({
  component: ExecutionsListPage,
  loader: async ({ params }) => {
    const executions = await fetchExecutions(params.id);
    return { executions };
  },
});

function ExecutionsListPage() {
  const { id: pipelineId } = Route.useParams();
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
                          {execution.summary
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
                            to="/pipelines/$id/executions/$executionId"
                            params={{ id: pipelineId, executionId: execution.id }}
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
