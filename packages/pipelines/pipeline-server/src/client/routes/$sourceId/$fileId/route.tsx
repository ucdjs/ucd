import { createFileRoute, Outlet } from "@tanstack/react-router";
import { sourceFileQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId/$fileId")({
  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData(
      sourceFileQueryOptions({
        sourceId: params.sourceId,
        fileId: params.fileId,
      }),
    );
  },
  component: FileLayout,
});

function FileLayout() {
  return <Outlet />;
}
