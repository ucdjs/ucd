import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { UnicodeFileTreeSchema, UnicodeVersionDetailsSchema, UnicodeVersionListSchema } from "@ucdjs/schemas";

export const fetchAllVersions = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const res = await fetch(`${context.apiBaseUrl}/api/v1/versions`, {
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch versions");
    }

    const json = await res.json();

    const parseResult = UnicodeVersionListSchema.safeParse(json);
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

export const fetchVersion = createServerFn({ method: "GET" })
  .inputValidator((data: { version: string }) => data)
  .handler(async ({ context, data }) => {
    const res = await fetch(`${context.apiBaseUrl}/api/v1/versions/${data.version}`, {
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch version ${data.version}`);
    }

    const json = await res.json();

    const parsedResult = UnicodeVersionDetailsSchema.safeParse(json);
    if (!parsedResult.success) {
      throw new Error("Invalid version detail data received from server");
    }

    return parsedResult.data;
  });

export function versionDetailsQueryOptions(version: string) {
  return queryOptions({
    queryKey: ["version-details", version],
    queryFn: () => fetchVersion({ data: { version } }),
    staleTime: 1000 * 60 * 60,
  });
}

export const fetchVersionFileTree = createServerFn({ method: "GET" })
  .inputValidator((data: { version: string }) => data)
  .handler(async ({ context, data }) => {
    const res = await fetch(`${context.apiBaseUrl}/api/v1/versions/${data.version}/file-tree`, {
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch file tree for version ${data.version}`);
    }

    const json = await res.json();
    const parseResult = UnicodeFileTreeSchema.safeParse(json);
    if (!parseResult.success) {
      throw new Error("Invalid file tree data received from server");
    }

    return parseResult.data;
  });

export function versionFileTreeQueryOptions(version: string) {
  return queryOptions({
    queryKey: ["version-file-tree", version],
    queryFn: () => fetchVersionFileTree({ data: { version } }),
    staleTime: 1000 * 60 * 60,
  });
}
