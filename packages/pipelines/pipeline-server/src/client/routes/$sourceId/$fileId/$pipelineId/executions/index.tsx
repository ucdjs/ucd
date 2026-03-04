import { createFileRoute } from "@tanstack/react-router";
import { executionsQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/executions/")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      executionsQueryOptions({
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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="block w-28 h-5 rounded bg-muted animate-pulse" />
          <span className="block w-40 h-3 rounded bg-muted animate-pulse" />
        </div>
        <span className="w-24 h-8 rounded-md bg-muted animate-pulse" />
      </div>
      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-3 flex items-center gap-4">
          <span className="w-20 h-3 rounded bg-muted animate-pulse" />
          <span className="w-16 h-3 rounded bg-muted animate-pulse" />
          <span className="w-24 h-3 rounded bg-muted animate-pulse" />
          <span className="flex-1" />
          <span className="w-12 h-3 rounded bg-muted animate-pulse" />
        </div>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={`ex-sk-${i}`} className="border-b last:border-0 px-4 py-3 flex items-center gap-4">
            <span className="w-3 h-3 rounded-full bg-muted animate-pulse shrink-0" />
            <span className="w-16 h-3 rounded bg-muted animate-pulse" />
            <span className="w-14 h-5 rounded-full bg-muted animate-pulse" />
            <span className="flex-1" />
            <span className="w-20 h-3 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
