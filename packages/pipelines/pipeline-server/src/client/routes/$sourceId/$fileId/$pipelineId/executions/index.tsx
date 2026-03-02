import { createFileRoute } from "@tanstack/react-router";
import { executionsQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/executions/")({
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(
      executionsQueryOptions({
        baseUrl: "",
        sourceId: params.sourceId,
        fileId: params.fileId,
        pipelineId: params.pipelineId,
        limit: 50,
      }),
    );
  },
  pendingComponent: ExecutionsPending,
});

function ExecutionsPending() {
  return (
    <div className="p-6 text-sm text-muted-foreground">
      Loading executions...
    </div>
  );
}
