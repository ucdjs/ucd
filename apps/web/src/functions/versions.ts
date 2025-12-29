import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { UnicodeVersionListSchema } from "@ucdjs/schemas";

export const fetchAllVersions = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const res = await fetch(`${context.apiBaseUrl}/api/v1/versions`, {
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch versions");
    }

    const parseResult = UnicodeVersionListSchema.safeParse(await res.json());
    if (!parseResult.success) {
      throw new Error("Invalid version data received from server");
    }

    return parseResult.data;
  });

export function versionsQueryOptions() {
  return queryOptions({
    queryKey: ["versions"],
    queryFn: () => fetchAllVersions(),
    staleTime: 1000 * 60 * 60,
  });
}
