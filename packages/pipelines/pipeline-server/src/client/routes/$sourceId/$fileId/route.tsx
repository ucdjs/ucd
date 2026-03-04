import type { NotFoundRouteProps } from "@tanstack/react-router";
import { createFileRoute, Link, notFound, Outlet } from "@tanstack/react-router";
import { sourceFileQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId/$fileId")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      sourceFileQueryOptions({
        sourceId: params.sourceId,
        fileId: params.fileId,
      }),
    );

    if (!data) {
      throw notFound({ data: { sourceId: params.sourceId, fileId: params.fileId } });
    }

    return data;
  },
  component: FileLayout,
  notFoundComponent: FileNotFound,
});

function FileLayout() {
  return <Outlet />;
}

function FileNotFound(props: NotFoundRouteProps) {
  const params = props.data as { sourceId: string; fileId: string } | undefined;

  return (
    <div className="flex-1 flex items-center justify-center p-8" role="alert">
      <div className="text-center max-w-md space-y-3">
        <p className="text-sm font-medium text-foreground">File not found</p>
        {params
          ? (
              <>
                <p className="text-xs text-muted-foreground">
                  The file
                  {" "}
                  <code className="bg-muted/50 px-1 rounded">{params.fileId}</code>
                  {" "}
                  could not be found in source
                  {" "}
                  <code className="bg-muted/50 px-1 rounded">{params.sourceId}</code>
                  .
                </p>
                <Link
                  to="/$sourceId"
                  params={{ sourceId: params.sourceId }}
                  className="inline-flex items-center text-xs text-primary hover:underline"
                >
                  Back to source
                </Link>
              </>
            )
          : (
              <p className="text-xs text-muted-foreground">
                This file does not exist.
              </p>
            )}
      </div>
    </div>
  );
}
