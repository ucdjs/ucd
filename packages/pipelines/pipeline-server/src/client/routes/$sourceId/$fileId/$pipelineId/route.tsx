import { createFileRoute } from "@tanstack/react-router";
import { pipelineQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId")({
  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData(
      pipelineQueryOptions("", params.sourceId, params.fileId, params.pipelineId),
    );
  },
});
