import type { ExecutionsResponse } from "#lib/pipeline-executions";
import { fetchExecutions } from "#lib/pipeline-executions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pipelines/$file/$id/graphs")({
  loader: async ({ params }) => {
    const executions = await fetchExecutions(params.file, params.id, { limit: 50 });
    return { executions } satisfies { executions: ExecutionsResponse };
  },
});
