import { createFileRoute } from "@tanstack/react-router";
import { PipelineGraph } from "@ucdjs/pipelines-ui";
import { usePipelineDetailContext } from "../hooks/pipeline-detail-context";

export const Route = createFileRoute("/pipelines/$id/graph")({
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
  const { execution } = usePipelineDetailContext();

  const graph = execution.result?.graph && execution.result.graph.nodes.length > 0
    ? execution.result.graph
    : null;

  if (!graph) {
    return <EmptyGraphState />;
  }

  return (
    <section
      className="h-130 bg-card border border-border rounded-lg overflow-hidden"
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
