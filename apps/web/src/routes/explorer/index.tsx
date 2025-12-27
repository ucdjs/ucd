import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/explorer/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      Hello, Explorer!

      <Link to="/explorer/files/$">Go to File Explorer</Link>
    </div>
  );
}
