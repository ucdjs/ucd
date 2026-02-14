import type { CodeResponse } from "../../../../types";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pipelines/$file/$id/code")({
  loader: async ({ params }): Promise<CodeResponse> => {
    const res = await fetch(`/api/pipelines/${params.file}/${params.id}/code`);
    if (!res.ok) {
      throw new Error(`Failed to load code (${res.status})`);
    }
    return res.json();
  },
});
