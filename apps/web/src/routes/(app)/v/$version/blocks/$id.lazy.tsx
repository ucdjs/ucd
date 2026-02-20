import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/(app)/v/$version/blocks/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/v/$version/blocks/$id"!</div>;
}
