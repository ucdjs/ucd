import { sourceQueryOptions } from "#queries/source";
import { isNotFoundError } from "#queries/utils";
import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId")({
  loader: async ({ context, params }) => {
    try {
      const source = await context.queryClient.ensureQueryData(sourceQueryOptions({ sourceId: params.sourceId }));
      if (!source.files.some((file) => file.id === params.sourceFileId)) {
        throw notFound();
      }
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
