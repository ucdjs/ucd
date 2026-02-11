import { createFileRoute } from "@tanstack/react-router";
import { PipelineGraph, useExecute } from "@ucdjs/pipelines-ui";

export const Route = createFileRoute("/pipelines/$file/$id/graph")({
  component: PipelineGraphPage,
});

function EmptyGraphState() {
  return (
    <section
      className="border border-dashed border-border rounded-lg p-6 text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      Run the pipeline to generate the execution graph.
    </section>
  );
}

function PipelineGraphPage() {
  const { result } = useExecute();

  const graph = result?.graph && result.graph.nodes.length > 0
    ? result.graph
    : null;

  if (!graph) {
    return (
      <div className="p-6">
        <EmptyGraphState />
      </div>
    );
  }

  return (
    <section
      className="h-full min-h-125 bg-card border border-border rounded-lg overflow-hidden m-6"
      role="tabpanel"
      id="tabpanel-graph"
      aria-labelledby="tab-graph"
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
