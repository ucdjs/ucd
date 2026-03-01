import { sourceQueryOptions } from "#lib/query-options";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$sourceId")({
  loader: async ({ context, params }) => {
    // try {
    const data = await context.queryClient.ensureQueryData(sourceQueryOptions(params.sourceId!));

    return {
      sourceId: params.sourceId,
      files: data.files || [],
      errors: data.errors || [],
    };
    // } catch (err) {

    // }
  },
});
