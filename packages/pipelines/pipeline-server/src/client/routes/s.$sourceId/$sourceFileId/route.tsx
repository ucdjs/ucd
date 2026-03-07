import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { isNotFoundError, sourceFileQueryOptions, sourceQueryOptions } from "@ucdjs/pipelines-ui";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId")({
  loader: async ({ context, params }) => {
    try {
      await Promise.all([
        context.queryClient.ensureQueryData(sourceQueryOptions({ sourceId: params.sourceId })),
        context.queryClient.ensureQueryData(sourceFileQueryOptions({
          sourceId: params.sourceId,
          fileId: params.sourceFileId,
        })),
      ]);
    } catch (error) {
      if (isNotFoundError(error)) {
        throw notFound();
      }

      throw error;
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
