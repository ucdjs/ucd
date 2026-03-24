import { pipelineQueryOptions } from "#queries/pipeline";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Shuffle } from "lucide-react";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect/transforms/")({
  loader: async ({ context, params }) => {
    const pipelineResponse = await context.queryClient.ensureQueryData(pipelineQueryOptions({
      sourceId: params.sourceId,
      fileId: params.sourceFileId,
      pipelineId: params.pipelineId,
    }));
    const allTransforms = new Set(pipelineResponse.pipeline.routes.flatMap((route) => route.transforms));
    const sorted = [...allTransforms].toSorted((a, b) => a.localeCompare(b));
    const firstName = sorted[0];
    if (firstName) {
      throw redirect({
        to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect/transforms/$transformName",
        params: { ...params, transformName: firstName },
      });
    }
  },
  component: TransformsIndexPage,
});

function TransformsIndexPage() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 px-4 py-16 text-center">
      <Shuffle className="mb-3 h-8 w-8 text-muted-foreground/50" />
      <div className="text-sm text-muted-foreground">
        No transforms defined in this pipeline.
      </div>
    </div>
  );
}
