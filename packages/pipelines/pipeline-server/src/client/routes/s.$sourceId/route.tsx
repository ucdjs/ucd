import { setLastActiveSource } from "#lib/last-active-source";
import { sourceQueryOptions } from "#queries/source";
import { isNotFoundError } from "#queries/utils";
import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/s/$sourceId")({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(sourceQueryOptions({ sourceId: params.sourceId }));
      setLastActiveSource(params.sourceId);
    } catch (err) {
      if (isNotFoundError(err)) {
        throw notFound();
      }

      throw err;
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
