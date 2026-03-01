import type { CodeResponse } from "../../../../types";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/code")({
  loader: async ({ params }): Promise<CodeResponse> => {
    const res = await fetch(`/api/sources/${params.sourceId}/${params.fileId}/${params.pipelineId}/code`);
    if (!res.ok) {
      throw new Error(`Failed to load code (${res.status})`);
    }
    return res.json();
  },
});
