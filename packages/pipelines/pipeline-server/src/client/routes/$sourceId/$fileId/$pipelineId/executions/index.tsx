import { executionsQueryOptions } from "#lib/query-options";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/executions/")({
  loader: async ({ context, params }) => {
    const executions = await context.queryClient.ensureQueryData(
      executionsQueryOptions(params.sourceId, params.fileId, params.pipelineId, 50)
    );
    return { executions };
  },
});
