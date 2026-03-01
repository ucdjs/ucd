import { executionsQueryOptions } from "@ucdjs/pipelines-ui/functions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/graphs")({
  loader: async ({ context, params }) => {
    const executions = await context.queryClient.ensureQueryData(
      executionsQueryOptions("", params.sourceId, params.fileId, params.pipelineId, 50)
    );
    return { executions };
  },
});
