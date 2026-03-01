import { sourceFileQueryOptions } from "@ucdjs/pipelines-ui/functions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$sourceId/$fileId")({
  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData(
      sourceFileQueryOptions("", params.sourceId, params.fileId),
    );
  },
});
