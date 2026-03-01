import { createLazyFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/$sourceId")({
  component: SourceLayout,
});

function SourceLayout() {
  return <Outlet />;
}
