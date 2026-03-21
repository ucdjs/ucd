import { createFileRoute } from "@tanstack/react-router";
import { FolderOutput } from "lucide-react";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect/outputs/")({
  component: OutputsIndexPage,
});

function OutputsIndexPage() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 px-4 py-16 text-center">
      <FolderOutput className="mb-3 h-8 w-8 text-muted-foreground/50" />
      <div className="text-sm text-muted-foreground">
        Select an output from the sidebar to view details.
      </div>
    </div>
  );
}
