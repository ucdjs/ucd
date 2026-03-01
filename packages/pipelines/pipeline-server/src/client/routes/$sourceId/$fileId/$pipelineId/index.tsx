import { createFileRoute } from "@tanstack/react-router";
import { executionsQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      executionsQueryOptions("", params.sourceId, params.fileId, params.pipelineId, 10),
    );
    return data;
  },
});
