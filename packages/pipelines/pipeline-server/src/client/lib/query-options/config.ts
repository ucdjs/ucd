import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

const ConfigSchema = z.object({
  workspaceId: z.string(),
  version: z.string(),
});

export function configQueryOptions() {
  return queryOptions({
    queryKey: ["config"],
    queryFn: async () => {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Failed to fetch config");
      const data = await res.json();
      return ConfigSchema.parse(data);
    },
    staleTime: Infinity,
  });
}
