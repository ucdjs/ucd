import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/pipelines/$file")({
  component: PipelineFileLayout,
});

function PipelineFileLayout() {
  return <Outlet />;
}
