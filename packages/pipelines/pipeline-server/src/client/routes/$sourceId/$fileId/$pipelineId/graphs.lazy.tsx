import { formatDuration, formatTimeAgo } from "#lib/pipeline-executions";
import { useSuspenseQuery } from "@tanstack/react-query";
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
import { executionsQueryOptions } from "@ucdjs/pipelines-ui";

export const Route = createLazyFileRoute("/$sourceId/$fileId/$pipelineId/graphs")({
  component: PipelineGraphsPage,
  pendingComponent: PipelineGraphsSkeleton,
});

function PipelineGraphsPage() {
  const { sourceId, fileId, pipelineId } = Route.useParams();
  const { data: executions } = useSuspenseQuery(executionsQueryOptions({
    sourceId,
    fileId,
    pipelineId,
    limit: 50,
  }));

  const graphExecutions = executions.executions.filter((execution) => execution.hasGraph);

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
                    {graphExecutions.map((execution) => (
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
                            to="/$sourceId/$fileId/$pipelineId/executions/$executionId/graph"
                            params={{ sourceId, fileId, pipelineId, executionId: execution.id }}
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

function PipelineGraphsSkeleton() {
  return (
    <div className="p-6">
      <div className="rounded-xl border bg-card">
        <div className="p-6">
          <span className="block w-36 h-5 rounded bg-muted animate-pulse" />
          <span className="block w-24 h-4 rounded bg-muted animate-pulse mt-2" />
        </div>
        <div className="px-6 pb-6">
          <div className="border rounded-md">
            <div className="flex items-center gap-4 px-4 py-3 border-b bg-muted/30">
              <span className="w-44 h-3 rounded bg-muted animate-pulse" />
              <span className="w-16 h-3 rounded bg-muted animate-pulse" />
              <span className="w-16 h-3 rounded bg-muted animate-pulse" />
              <span className="w-20 h-3 rounded bg-muted animate-pulse" />
              <span className="w-14 h-3 rounded bg-muted animate-pulse ml-auto" />
              <span className="w-10 h-3 rounded bg-muted animate-pulse" />
            </div>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={`row-${i}`} className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0">
                <span className="w-44 h-4 rounded bg-muted animate-pulse" />
                <span className="w-16 h-3 rounded bg-muted animate-pulse" />
                <span className="w-16 h-3 rounded bg-muted animate-pulse" />
                <div className="flex gap-1">
                  <span className="w-12 h-5 rounded-full bg-muted animate-pulse" />
                  <span className="w-10 h-5 rounded-full bg-muted animate-pulse" />
                </div>
                <span className="w-14 h-3 rounded bg-muted animate-pulse ml-auto" />
                <span className="w-10 h-3 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
