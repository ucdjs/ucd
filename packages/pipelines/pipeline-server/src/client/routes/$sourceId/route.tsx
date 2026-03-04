import type { NotFoundRouteProps } from "@tanstack/react-router";
import { createFileRoute, Link, notFound, Outlet } from "@tanstack/react-router";
import { overviewQueryOptions, sourceQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId")({
  loader: async ({ context, params }) => {
    context.queryClient.prefetchQuery(overviewQueryOptions());

    const data = await context.queryClient.ensureQueryData(
      sourceQueryOptions({ sourceId: params.sourceId }),
    );

    if (!data) {
      throw notFound({ data: { sourceId: params.sourceId } });
    }

    return data;
  },
  component: SourceLayout,
  notFoundComponent: SourceNotFound,
});

function SourceLayout() {
  return <Outlet />;
}

function SourceNotFound(props: NotFoundRouteProps) {
  const params = props.data as { sourceId: string } | undefined;

  return (
    <div className="flex-1 flex items-center justify-center p-8" role="alert">
      <div className="text-center max-w-md space-y-3">
        <p className="text-sm font-medium text-foreground">Source not found</p>
        {params
          ? (
              <>
                <p className="text-xs text-muted-foreground">
                  The source
                  {" "}
                  <code className="bg-muted/50 px-1 rounded">{params.sourceId}</code>
                  {" "}
                  could not be found.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center text-xs text-primary hover:underline"
                >
                  Back to home
                </Link>
              </>
            )
          : (
              <p className="text-xs text-muted-foreground">
                This source does not exist.
              </p>
            )}
      </div>
    </div>
  );
}
