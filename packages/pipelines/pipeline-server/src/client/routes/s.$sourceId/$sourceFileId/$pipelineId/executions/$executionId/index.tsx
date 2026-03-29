import { executionTracesQueryOptions } from "#queries/execution";
import { isNotFoundError } from "#queries/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId/")({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(executionTracesQueryOptions({
        sourceId: params.sourceId,
        fileId: params.sourceFileId,
        pipelineId: params.pipelineId,
        executionId: params.executionId,
        limit: 500,
      }));
    } catch (error) {
      if (isNotFoundError(error)) {
        throw notFound();
      }

      throw error;
    }
  },
  component: ExecutionDetailPage,
});

function ExecutionDetailPage() {
  const { sourceId, sourceFileId, pipelineId, executionId } = Route.useParams();
  const { data } = useSuspenseQuery(executionTracesQueryOptions({
    sourceId,
    fileId: sourceFileId,
    pipelineId,
    executionId,
    limit: 500,
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-auto">
        {data.traces.length === 0 && (
          <p className="p-4 text-muted-foreground text-sm">No trace data available.</p>
        )}
        {data.traces.length > 0 && (
          <p className="p-4 text-muted-foreground text-sm">Waterfall coming soon…</p>
        )}
      </div>

      <div className="h-48 border-t flex items-center justify-center shrink-0">
        <p className="text-muted-foreground text-sm">Logs Viewer</p>
      </div>
    </div>
  );
}
