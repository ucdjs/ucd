import { LogsViewer } from "#components/execution/logs/logs-viewer";
import { WaterfallView } from "#components/execution/waterfall/index";
import { executionLogsQueryOptions, executionTracesQueryOptions } from "#queries/execution";
import { isNotFoundError } from "#queries/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Suspense, useState } from "react";

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

    // Prefetch logs in parallel (non-blocking — logs panel uses its own Suspense)
    void context.queryClient.prefetchQuery(executionLogsQueryOptions({
      sourceId: params.sourceId,
      fileId: params.sourceFileId,
      pipelineId: params.pipelineId,
      executionId: params.executionId,
      limit: 500,
    }));
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

  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-hidden">
        {data.spans.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No trace data available.</p>
        )}
        {data.spans.length > 0 && (
          <WaterfallView
            traceId={data.traceId}
            spans={data.spans}
            onSpanSelect={setSelectedSpanId}
          />
        )}
      </div>

      <div className="h-64 border-t shrink-0">
        <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading logs…</div>}>
          <LogsViewer
            sourceId={sourceId}
            fileId={sourceFileId}
            pipelineId={pipelineId}
            executionId={executionId}
            selectedSpanId={selectedSpanId}
            onClearSpan={() => setSelectedSpanId(null)}
          />
        </Suspense>
      </div>
    </div>
  );
}
