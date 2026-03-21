import { createFileRoute } from "@tanstack/react-router";
import { Shuffle } from "lucide-react";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect/transforms/")({
  component: TransformsIndexPage,
});

function TransformsIndexPage() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 px-4 py-16 text-center">
      <Shuffle className="mb-3 h-8 w-8 text-muted-foreground/50" />
      <div className="text-sm text-muted-foreground">
        Select a transform from the sidebar to view details.
      </div>
    </div>
  );
}
