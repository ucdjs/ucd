import { createFileRoute } from "@tanstack/react-router";
import { pipelineCodeQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/code")({
  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData(
      pipelineCodeQueryOptions("", params.sourceId, params.fileId, params.pipelineId),
    );
  },
});
