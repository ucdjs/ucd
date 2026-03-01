import { createFileRoute } from "@tanstack/react-router";
import { executionGraphQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/executions/$executionId/graph")({
  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData(
      executionGraphQueryOptions("", params.sourceId, params.fileId, params.pipelineId, params.executionId),
    );
  },
});
