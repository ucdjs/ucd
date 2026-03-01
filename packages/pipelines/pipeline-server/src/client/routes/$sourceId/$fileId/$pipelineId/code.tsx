import { codeQueryOptions } from "#lib/query-options";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/code")({
  loader: async ({ context, params }) => {
    const codeData = await context.queryClient.ensureQueryData(
      codeQueryOptions(params.sourceId, params.fileId, params.pipelineId)
    );
    return { codeData };
  },
});
