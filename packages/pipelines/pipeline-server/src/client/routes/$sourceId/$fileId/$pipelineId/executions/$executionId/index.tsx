import { createFileRoute } from "@tanstack/react-router";
import { executionEventsQueryOptions, executionLogsQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/executions/$executionId/")({
  loader: async ({ context, params }) => {
    context.queryClient.prefetchQuery(
      executionEventsQueryOptions({
        sourceId: params.sourceId,
        fileId: params.fileId,
        pipelineId: params.pipelineId,
        executionId: params.executionId,
      }),
    );
    context.queryClient.prefetchQuery(
      executionLogsQueryOptions({
        sourceId: params.sourceId,
        fileId: params.fileId,
        pipelineId: params.pipelineId,
        executionId: params.executionId,
      }),
    );
  },
});
