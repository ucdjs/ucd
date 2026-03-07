import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import { ConfigSchema } from "../schemas/config";

export async function fetchConfig({
  baseUrl,
}: {
  baseUrl: string;
}) {
  return customFetch(`${baseUrl}/api/config`, {
    schema: ConfigSchema,
  });
}

export function configQueryOptions({
  baseUrl,
}: {
  baseUrl: string;
}) {
  return queryOptions({
    queryKey: ["config"],
    queryFn: () => fetchConfig({ baseUrl }),
    staleTime: Infinity,
  });
}
