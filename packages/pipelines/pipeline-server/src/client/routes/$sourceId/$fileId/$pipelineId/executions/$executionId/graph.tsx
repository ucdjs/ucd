import { executionGraphQueryOptions } from "#lib/query-options";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/executions/$executionId/graph")({
  loader: async ({ context, params }) => {
    const graphData = await context.queryClient.ensureQueryData(
      executionGraphQueryOptions(params.sourceId, params.fileId, params.pipelineId, params.executionId)
    );
    return { graphData };
  },
});
