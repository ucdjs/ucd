import { pipelineQueryOptions } from "#queries/pipeline";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { FolderOutput } from "lucide-react";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect/outputs/")({
  loader: async ({ context, params }) => {
    const pipeline = await context.queryClient.ensureQueryData(pipelineQueryOptions({
      sourceId: params.sourceId,
      fileId: params.sourceFileId,
      pipelineId: params.pipelineId,
    }));
    const firstRoute = pipeline.routes[0];
    if (firstRoute && firstRoute.outputs.length > 0) {
      throw redirect({
        to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect/outputs/$outputKey",
        params: { ...params, outputKey: `${firstRoute.id}:0` },
      });
    }
  },
  component: OutputsIndexPage,
});

function OutputsIndexPage() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 px-4 py-16 text-center">
      <FolderOutput className="mb-3 h-8 w-8 text-muted-foreground/50" />
      <div className="text-sm text-muted-foreground">
        No outputs defined in this pipeline.
      </div>
    </div>
  );
}
