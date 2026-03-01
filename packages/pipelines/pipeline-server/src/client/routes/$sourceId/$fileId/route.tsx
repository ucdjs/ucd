import { sourceFileQueryOptions } from "#lib/query-options";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$sourceId/$fileId")({
  loader: async ({ context, params }) => {
    const fileData = await context.queryClient.ensureQueryData(
      sourceFileQueryOptions(params.sourceId, params.fileId),
    );
    return { fileData };
  },
});
