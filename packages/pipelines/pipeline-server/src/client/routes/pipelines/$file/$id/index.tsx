import { fetchExecutions } from "#lib/pipeline-executions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pipelines/$file/$id/")({
  loader: async ({ params }) => {
    const executions = await fetchExecutions(params.file, params.id);
    return { executions };
  },
});
