import { createLazyFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/$sourceId")({
  component: SourceLayout,
  notFoundComponent(props) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-foreground">Source Not Found</h1>
        <p className="text-sm text-muted-foreground mt-2">
          The source with ID
          {" "}
          <code className="bg-muted/50 px-1 rounded">{props.params.sourceId}</code>
          {" "}
          could not be found.
        </p>
      </div>
    );
  },
});

function SourceLayout() {
  return <Outlet />;
}
