import type { ExecutionsResponse } from "#lib/pipeline-executions";
import { fetchExecutions } from "#lib/pipeline-executions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/graphs")({
  loader: async ({ params }) => {
    const executions = await fetchExecutions(params.fileId, params.pipelineId, { limit: 50 }, params.sourceId);
    return { executions } satisfies { executions: ExecutionsResponse };
  },
});
