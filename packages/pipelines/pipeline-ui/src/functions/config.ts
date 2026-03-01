import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { fetchWithParse } from "./fetch-with-parse";

const ConfigSchema = z.object({
  workspaceId: z.string(),
  version: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;

export async function fetchConfig(baseUrl: string): Promise<Config> {
  return fetchWithParse(
    `${baseUrl}/api/config`,
    ConfigSchema,
  );
}

export function configQueryOptions(baseUrl: string) {
  return queryOptions({
    queryKey: ["config"],
    queryFn: () => fetchConfig(baseUrl),
    staleTime: Infinity,
  });
}