import { createFileRoute, notFound } from "@tanstack/react-router";
import { sourceQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      sourceQueryOptions("", params.sourceId),
    );

    if (!data) {
      throw notFound();
    }

    return data;
  },
});
