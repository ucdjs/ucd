import type { PipelineGraph } from "@ucdjs/pipelines-core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/$sourceId/$fileId/$pipelineId/executions/$executionId/graph",
)({
  loader: async ({ params }) => {
    const response = await fetch(
      `/api/pipelines/${params.fileId}/${params.pipelineId}/executions/${params.executionId}/graph`,
    );
    if (!response.ok) {
      throw new Error("Failed to load execution graph");
    }
    return response.json() as Promise<{ graph: PipelineGraph | null }>;
  },
});
