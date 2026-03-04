import { createFileRoute, notFound, Outlet, useParams } from "@tanstack/react-router";
import { overviewQueryOptions, sourceQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId")({
  loader: async ({ context, params }) => {
    context.queryClient.prefetchQuery(overviewQueryOptions({ baseUrl: "" }));

    const data = await context.queryClient.ensureQueryData(
      sourceQueryOptions({ sourceId: params.sourceId }),
    );

    if (!data) {
      throw notFound();
    }

    return data;
  },
  component: SourceLayout,
  notFoundComponent: SourceNotFound,
});

function SourceLayout() {
  return <Outlet />;
}

function SourceNotFound() {
  const { sourceId } = useParams({ from: "/$sourceId" });
  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground">Source Not Found</h1>
      <p className="text-sm text-muted-foreground mt-2">
        The source with ID
        {" "}
        <code className="bg-muted/50 px-1 rounded">{sourceId}</code>
        {" "}
        could not be found.
      </p>
    </div>
  );
}
