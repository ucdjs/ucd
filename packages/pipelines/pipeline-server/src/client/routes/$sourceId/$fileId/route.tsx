import { sourceFileQueryOptions } from "#lib/query-options";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$sourceId/$fileId")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(sourceFileQueryOptions(params.sourceId, params.fileId));
    return {
      sourceId: params.sourceId,
      fileId: params.fileId,
      file: data.file,
      pipelines: data.file.pipelines,
    };
  },
});
