import { createFileRoute } from "@tanstack/react-router";
import { executionsQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/")({
  loader: async ({ context, params }) => {
    context.queryClient.prefetchQuery(executionsQueryOptions({
      baseUrl: "",
      sourceId: params.sourceId,
      fileId: params.fileId,
      pipelineId: params.pipelineId,
      limit: 50,
    }));
  },
});
