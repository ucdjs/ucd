import { createFileRoute } from "@tanstack/react-router";
import { pipelineCodeQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/code")({
  loader: async ({ context, params }) => {
    context.queryClient.prefetchQuery(
      pipelineCodeQueryOptions({
        sourceId: params.sourceId,
        fileId: params.fileId,
        pipelineId: params.pipelineId,
      }),
    );
  },
});
