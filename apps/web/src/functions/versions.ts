import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

export const fetchAllVersions = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const { data, error, response } = await context.client.versions.list();

    if (error || !response?.ok || !data) {
      throw new Error("Failed to fetch versions");
    }

    return data;
  });

export function versionsQueryOptions() {
  return queryOptions({
    queryKey: ["versions"],
    queryFn: () => fetchAllVersions(),
  });
}

export const fetchVersion = createServerFn({ method: "GET" })
  .inputValidator((data: { version: string }) => data)
  .handler(async ({ context, data }) => {
    const { data: version, error, response } = await context.client.versions.get(data.version);

    if (error || !response?.ok || !version) {
      throw new Error(`Failed to fetch version ${data.version}`);
    }

    return version;
  });

export function versionDetailsQueryOptions(version: string) {
  return queryOptions({
    queryKey: ["version-details", version],
    queryFn: () => fetchVersion({ data: { version } }),
  });
}

export const fetchVersionFileTree = createServerFn({ method: "GET" })
  .inputValidator((data: { version: string }) => data)
  .handler(async ({ context, data }) => {
    const { data: fileTree, error, response } = await context.client.versions.getFileTree(data.version);

    if (error || !response?.ok || !fileTree) {
      throw new Error(`Failed to fetch file tree for version ${data.version}`);
    }

    return fileTree;
  });

export function versionFileTreeQueryOptions(version: string) {
  return queryOptions({
    queryKey: ["version-file-tree", version],
    queryFn: () => fetchVersionFileTree({ data: { version } }),
  });
}
