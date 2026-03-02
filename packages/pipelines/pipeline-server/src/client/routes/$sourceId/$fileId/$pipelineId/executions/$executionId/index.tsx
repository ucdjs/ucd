import { createFileRoute } from "@tanstack/react-router";
import { executionEventsQueryOptions, executionLogsQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/executions/$executionId/")({
  loader: async ({ context, params }) => {
    const [executionData, logsData] = await Promise.all([
      context.queryClient.ensureQueryData(
        executionEventsQueryOptions("", params.sourceId, params.fileId, params.pipelineId, params.executionId),
      ),
      context.queryClient.ensureQueryData(
        executionLogsQueryOptions("", params.sourceId, params.fileId, params.pipelineId, params.executionId),
      ),
    ]);
    return { executionData, logsData };
  },
});
