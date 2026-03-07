import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { isNotFoundError, sourceQueryOptions } from "@ucdjs/pipelines-ui";

export const Route = createFileRoute("/s/$sourceId")({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(sourceQueryOptions({ sourceId: params.sourceId }));
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
