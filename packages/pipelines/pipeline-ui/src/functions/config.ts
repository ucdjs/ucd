import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import { z } from "zod";

const ConfigSchema = z.object({
  workspaceId: z.string(),
  version: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;

export async function fetchConfig(baseUrl: string): Promise<Config> {
  const { data, error } = await customFetch.safe(
    `${baseUrl}/api/config`,
    {
      schema: ConfigSchema,
    },
  );

  if (error) {
    throw new Error(`Failed to fetch config: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Failed to fetch config: No data returned`);
  }

  return data;
}

export function configQueryOptions(baseUrl: string) {
  return queryOptions({
    queryKey: ["config"],
    queryFn: () => fetchConfig(baseUrl),
    staleTime: Infinity,
  });
}
