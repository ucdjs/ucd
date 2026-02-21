import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/v/$version/blocks/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/v/$version/blocks/$id"!</div>;
}
