import { createFileRoute } from "@tanstack/react-router";
import { PipelineGraph, useExecute } from "@ucdjs/pipelines-ui";
import { fetchExecutionEvents } from ".";

export const Route = createFileRoute(
  "/pipelines/$file/$id/executions/$executionId/graph",
)({
  component: RouteComponent,
  loader: async ({ params }) => {
    const executionData = await fetchExecutionEvents(params.executionId);
    return { executionData };
  },
});

function RouteComponent() {
  Route.useParams();
  Route.useLoaderData();
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
