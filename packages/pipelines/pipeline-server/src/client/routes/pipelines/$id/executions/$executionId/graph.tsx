import { createFileRoute } from "@tanstack/react-router";
import { PipelineGraph, useExecute } from "@ucdjs/pipelines-ui";
import { fetchExecutionEvents } from ".";

export const Route = createFileRoute(
  "/pipelines/$id/executions/$executionId/graph",
)({
  component: RouteComponent,
  loader: async ({ params }) => {
    const executionData = await fetchExecutionEvents(params.executionId);
    return { executionData };
  },
});

function RouteComponent() {
  const { id: pipelineId } = Route.useParams();
  const { executions } = Route.useLoaderData();
  const { result: currentExecution } = useExecute();
  return (
    <div>
      <PipelineGraph
        graph={currentExecution?.graph!}
        showFilters
        showDetails
        showMinimap
        className="bg-card"
      />
    </div>
  );
}
