import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  executionGraphQueryOptions,
  isNotFoundError,
  PipelineGraph,
} from "@ucdjs/pipelines-ui";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId/graph")({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(executionGraphQueryOptions({
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
      <div className="p-6">
        <section
          className="border border-dashed border-border rounded-lg p-6 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          No graph recorded for this execution.
        </section>
      </div>
    );
  }

  return (
    <section
      className="h-full min-h-125 bg-card border border-border rounded-lg overflow-hidden m-6"
      role="tabpanel"
      id="tabpanel-execution-graph"
      aria-labelledby="tab-graphs"
    >
      <PipelineGraph
        graph={graph}
        showFilters
        showDetails
        showMinimap
        className="bg-card"
      />
    </section>
  );
}
