import { fetchExecutionEvents, fetchExecutionLogs } from "#lib/pipeline-execution-logs";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/executions/$executionId/")({
  loader: async ({ params }) => {
    const [executionData, logsData] = await Promise.all([
      fetchExecutionEvents(params.fileId, params.pipelineId, params.executionId),
      fetchExecutionLogs(params.fileId, params.pipelineId, params.executionId),
    ]);
    return { executionData, logsData };
  },
});
