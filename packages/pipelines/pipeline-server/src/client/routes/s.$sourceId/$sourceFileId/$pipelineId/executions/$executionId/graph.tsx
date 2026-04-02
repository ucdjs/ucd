import { StatusBadge } from "#components/execution/status-badge";
import { PipelineGraph } from "#components/graph/pipeline-graph";
import { executionGraphQueryOptions } from "#queries/execution";
import { isNotFoundError } from "#queries/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@ucdjs-internal/shared-ui/components";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId/graph")({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.prefetchQuery(executionGraphQueryOptions({
        sourceId: params.sourceId,
        fileId: params.sourceFileId,
        pipelineId: params.pipelineId,
        executionId: params.executionId,
      }));
    } catch (error) {
      if (isNotFoundError(error)) {
        throw notFound();
      }

      throw error;
    }
  },
  component: ExecutionGraphPage,
});

function ExecutionGraphPage() {
  const { sourceId, sourceFileId, pipelineId, executionId } = Route.useParams();
  const { data } = useSuspenseQuery(executionGraphQueryOptions({
    sourceId,
    fileId: sourceFileId,
    pipelineId,
    executionId,
  }));
  const graph = data.graph;
  const shortExecutionId = executionId.slice(0, 8);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b bg-background px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-3">
            <Button
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="-ml-2 w-fit"
              render={(props) => (
                <Link
                  to="/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId"
                  params={{ sourceId, sourceFileId, pipelineId, executionId }}
                  {...props}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </Link>
              )}
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight">
                  Execution
                  {" "}
                  {shortExecutionId}
                </h1>
                <StatusBadge status={data.status} />
              </div>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              render={(props) => (
                <Link
                  to="/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId"
                  params={{ sourceId, sourceFileId, pipelineId, executionId }}
                  {...props}
                >
                  Logs
                </Link>
              )}
            />

            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              render={(props) => (
                <Link
                  to="/s/$sourceId/$sourceFileId/$pipelineId/executions"
                  params={{ sourceId, sourceFileId, pipelineId }}
                  {...props}
                >
                  Executions
                </Link>
              )}
            />
          </div>
        </div>
      </header>

      {!graph || graph.nodes.length === 0
        ? (
            <section
              className="m-4 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 p-6 text-sm text-muted-foreground sm:m-6"
              role="status"
              aria-live="polite"
            >
              No graph
            </section>
          )
        : (
            <div className="min-h-0 flex-1 p-4 sm:p-6">
              <section
                className="h-full min-h-[24rem] overflow-hidden rounded-2xl border border-border/70 bg-background"
                role="region"
                aria-label="Graph"
              >
                <PipelineGraph
                  graph={graph}
                  showFilters
                  showDetails
                  showMinimap
                  className="h-full"
                />
              </section>
            </div>
          )}
    </div>
  );
}
