import { createLazyFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/pipelines/$file")({
  component: PipelineFileLayout,
});

function PipelineFileLayout() {
  return <Outlet />;
}
