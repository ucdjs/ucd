import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId")({
  loader: async ({ params }) => {
    const res = await fetch(`/api/sources/${params.sourceId}/${params.fileId}/${params.pipelineId}`);

    if (!res.ok) {
      if (res.status === 404) {
        throw notFound();
      }
      throw new Error(`Failed to load pipeline (${res.status})`);
    }

    const data = await res.json();
    console.log(data);
    return data;
  },
});
