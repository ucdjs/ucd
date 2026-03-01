import { pipelineQueryOptions } from "#lib/query-options";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId")({
  loader: async ({ context, params }) => {
    const pipelineData = await context.queryClient.ensureQueryData(
      pipelineQueryOptions(params.sourceId, params.fileId, params.pipelineId),
    );
    return { pipelineData };
  },
});
