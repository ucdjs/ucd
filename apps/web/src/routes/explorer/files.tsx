import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/explorer/files")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/explorer/files"!</div>;
}
