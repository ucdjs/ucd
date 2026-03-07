import { createLazyFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/$sourceId/$fileId")({
  component: FileLayout,
});

function FileLayout() {
  return <Outlet />;
}
