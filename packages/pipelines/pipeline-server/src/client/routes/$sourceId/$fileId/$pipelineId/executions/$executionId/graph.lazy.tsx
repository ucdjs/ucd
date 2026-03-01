import { createLazyFileRoute } from "@tanstack/react-router";
import { PipelineGraph } from "@ucdjs/pipelines-ui";

export const Route = createLazyFileRoute("/$sourceId/$fileId/$pipelineId/executions/$executionId/graph")({
  component: PipelineExecutionGraphPage,
});

function PipelineExecutionGraphPage() {
  const { graph } = Route.useLoaderData();

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
