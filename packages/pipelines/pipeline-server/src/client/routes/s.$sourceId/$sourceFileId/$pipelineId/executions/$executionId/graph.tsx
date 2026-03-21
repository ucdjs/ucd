import { StatusBadge } from "#components/execution/status-badge";
import { PipelineGraph } from "#components/graph/pipeline-graph";
import { executionGraphQueryOptions } from "#queries/execution";
import { isNotFoundError } from "#queries/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

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

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="flex h-full flex-col p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Execution graph</h1>
          </div>
          <StatusBadge status={data.status} />
        </div>
        <section
          className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          No graph recorded for this execution.
        </section>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Execution graph</h1>
        </div>
        <StatusBadge status={data.status} />
      </div>

      <section
        className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-card/40"
        role="tabpanel"
        id="tabpanel-execution-graph"
        aria-labelledby="tab-graphs"
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
  );
}
