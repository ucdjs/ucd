import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { useExecute } from "@ucdjs/pipelines-ui";

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
    return `${(durationMs / 60000).toFixed(1)}m`;
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function getStatusColor(status: Execution["status"]): string {
  switch (status) {
    case "running":
      return "bg-yellow-500";
    case "completed":
      return "bg-green-500";
    case "failed":
      return "bg-red-500";
    default:
      return "bg-gray-500";
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
  const { id: pipelineId } = useParams({ from: "/pipelines/$id/executions/" });
  const { executions } = Route.useLoaderData();
  const { result: currentExecution } = useExecute();

  // Combine with current execution from useExecute if available
  const allExecutions = currentExecution
    ? [
        {
          id: "current",
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
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Executions</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {allExecutions.length}
              {" "}
              total executions
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {allExecutions.length === 0
            ? (
                <p className="text-sm text-muted-foreground" role="status">
                  No executions yet. Execute the pipeline to create one.
                </p>
              )
            : (
                <div className="space-y-2">
                  {allExecutions.map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between p-3 rounded-md border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(execution.status)}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {execution.id === "current" ? "Current" : `${execution.id.slice(0, 8)}...`}
                            </span>
                            <Badge
                              variant={
                                execution.status === "completed"
                                  ? "default"
                                  : execution.status === "failed"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {execution.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(execution.startedAt)}
                            {" "}
                            •
                            {" "}
                            {formatDuration(execution.startedAt, execution.completedAt)}
                          </p>
                          {execution.versions && execution.versions.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Versions:
                              {" "}
                              {execution.versions.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {execution.summary && (
                          <div className="text-right text-xs text-muted-foreground">
                            <p>
                              {execution.summary.totalRoutes}
                              {" "}
                              routes
                            </p>
                            <p>
                              {execution.summary.cached}
                              {" "}
                              cached
                            </p>
                          </div>
                        )}
                        <Link
                          to="/pipelines/$id/executions/$executionId"
                          params={{ id: pipelineId, executionId: execution.id }}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
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
    </div>
  );
}
