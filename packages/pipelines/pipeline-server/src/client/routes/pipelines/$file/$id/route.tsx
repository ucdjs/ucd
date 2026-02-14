import type { PipelineResponse } from "@ucdjs/pipelines-ui";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/pipelines/$file/$id")({
  loader: async ({ params }) => {
    const res = await fetch(`/api/pipelines/${params.file}/${params.id}`);

    if (!res.ok) {
      if (res.status === 404) {
        throw notFound();
      }
      throw new Error(`Failed to load pipeline (${res.status})`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data as PipelineResponse;
  },
});
