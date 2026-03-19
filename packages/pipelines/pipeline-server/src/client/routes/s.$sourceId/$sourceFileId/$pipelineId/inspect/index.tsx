import { InspectOutputsPanel } from "#components/inspect/inspect-outputs-panel";
import { InspectRoutesPanel } from "#components/inspect/inspect-routes-panel";
import { InspectTransformsPanel } from "#components/inspect/inspect-transforms-panel";
import { useInspectData } from "#hooks/use-inspect-data";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { search } = useInspectData();

  switch (search.view) {
    case "transforms": return <InspectTransformsPanel />;
    case "outputs": return <InspectOutputsPanel />;
    default: return <InspectRoutesPanel />;
  }
}
