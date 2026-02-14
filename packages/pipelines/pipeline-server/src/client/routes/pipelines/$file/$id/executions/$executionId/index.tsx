import { fetchExecutionEvents, fetchExecutionLogs } from "#lib/pipeline-execution-logs";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pipelines/$file/$id/executions/$executionId/")({
  loader: async ({ params }) => {
    const [executionData, logsData] = await Promise.all([
      fetchExecutionEvents(params.file, params.id, params.executionId),
      fetchExecutionLogs(params.file, params.id, params.executionId),
    ]);
    return { executionData, logsData };
  },
});
