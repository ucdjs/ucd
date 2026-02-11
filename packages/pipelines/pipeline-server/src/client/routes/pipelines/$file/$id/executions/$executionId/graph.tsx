import type { PipelineGraph as PipelineGraphType } from "@ucdjs/pipelines-core";
import { createFileRoute } from "@tanstack/react-router";
import { PipelineGraph } from "@ucdjs/pipelines-ui";

export const Route = createFileRoute(
  "/pipelines/$file/$id/executions/$executionId/graph",
)({
  component: RouteComponent,
  loader: async ({ params }) => {
    const response = await fetch(
      `/api/pipelines/${params.file}/${params.id}/executions/${params.executionId}/graph`,
    );
    if (!response.ok) {
      throw new Error("Failed to load execution graph");
    }
    return response.json() as Promise<{ graph: PipelineGraphType | null }>;
  },
});

function RouteComponent() {
  const data = Route.useLoaderData();
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
