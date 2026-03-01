import { sourceQueryOptions } from "#lib/query-options";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$sourceId")({
  loader: async ({ context, params }) => {
    const sourceData = await context.queryClient.ensureQueryData(
      sourceQueryOptions(params.sourceId),
    );
    return { sourceData };
  },
});
