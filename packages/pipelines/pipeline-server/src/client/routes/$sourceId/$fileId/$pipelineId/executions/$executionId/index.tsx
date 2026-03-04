import { createFileRoute } from "@tanstack/react-router";
import { executionEventsQueryOptions, executionLogsQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/executions/$executionId/")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        executionEventsQueryOptions({
          sourceId: params.sourceId,
          fileId: params.fileId,
          pipelineId: params.pipelineId,
          executionId: params.executionId,
        }),
      ),
      context.queryClient.ensureQueryData(
        executionLogsQueryOptions({
          sourceId: params.sourceId,
          fileId: params.fileId,
          pipelineId: params.pipelineId,
          executionId: params.executionId,
        }),
      ),
    ]);
  },
  pendingComponent: ExecutionDetailPending,
});

function ExecutionDetailPending() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b bg-background px-6 py-4 shrink-0">
        <div className="flex items-center gap-4">
          <span className="w-8 h-8 rounded-md bg-muted animate-pulse" />
          <span className="w-5 h-5 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-36 h-5 rounded bg-muted animate-pulse" />
              <span className="w-16 h-5 rounded-full bg-muted animate-pulse" />
            </div>
            <span className="block w-40 h-3 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
      <div className="flex-1 p-6 space-y-6">
        <div className="rounded-xl border bg-card p-4">
          <span className="block w-24 h-4 rounded bg-muted animate-pulse mb-3" />
          <div className="space-y-1.5">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={`wf-sk-${i}`} className="flex items-center gap-2">
                <span className="w-20 h-3 rounded bg-muted animate-pulse" />
                <span
                  className="h-5 rounded bg-muted animate-pulse"
                  style={{ width: `${60 + Math.random() * 30}%` }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3 flex items-center gap-4">
            <span className="w-16 h-3 rounded bg-muted animate-pulse" />
            <span className="w-12 h-3 rounded bg-muted animate-pulse" />
            <span className="flex-1" />
            <span className="w-20 h-3 rounded bg-muted animate-pulse" />
          </div>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={`log-sk-${i}`} className="border-b last:border-0 px-4 py-2.5 flex items-center gap-3">
              <span className="w-14 h-3 rounded bg-muted animate-pulse shrink-0" />
              <span className="w-10 h-4 rounded-full bg-muted animate-pulse shrink-0" />
              <span className="flex-1 h-3 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
