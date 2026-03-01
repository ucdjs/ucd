import { createFileRoute } from "@tanstack/react-router";
import { sourceQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId")({
  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData(
      sourceQueryOptions("", params.sourceId),
    );
  },
});
