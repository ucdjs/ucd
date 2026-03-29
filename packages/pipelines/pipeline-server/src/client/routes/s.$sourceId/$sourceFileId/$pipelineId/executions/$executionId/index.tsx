import { WaterfallView } from "#components/execution/waterfall/index";
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
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-hidden">
        {data.spans.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No trace data available.</p>
        )}
        {data.spans.length > 0 && (
          <WaterfallView traceId={data.traceId} spans={data.spans} />
        )}
      </div>

      <div className="h-48 border-t flex items-center justify-center shrink-0">
        <p className="text-muted-foreground text-sm">Logs Viewer</p>
      </div>
    </div>
  );
}
