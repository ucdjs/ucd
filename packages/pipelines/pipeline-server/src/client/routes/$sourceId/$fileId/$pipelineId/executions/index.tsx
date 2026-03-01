import { fetchExecutions } from "#lib/pipeline-executions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/executions/")({
  loader: async ({ params }) => {
    const executions = await fetchExecutions(params.fileId, params.pipelineId, { limit: 50 }, params.sourceId);
    return { executions };
  },
});
