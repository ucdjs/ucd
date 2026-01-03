import type { CompareOptions, VersionComparison } from "@ucdjs/ucd-store";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { createHTTPUCDStore } from "@ucdjs/ucd-store";

// Cache for store instances per baseUrl on the server
const storeCache = new Map<string, ReturnType<typeof createHTTPUCDStore>>();

/**
 * Get or create a cached UCD store instance for the given baseUrl.
 * This runs on the server and caches stores to avoid recreating them.
 */
async function getOrCreateStore(baseUrl: string) {
  let storePromise = storeCache.get(baseUrl);
  if (!storePromise) {
    storePromise = createHTTPUCDStore({
      baseUrl,
      bootstrap: true,
      verify: false,
    });
    storeCache.set(baseUrl, storePromise);
  }
  return storePromise;
}

export interface CompareVersionsInput {
  from: string;
  to: string;
  includeFileHashes?: boolean;
}

/**
 * Server function to compare two Unicode versions.
 * Uses the UCD store's compare operation with API mode.
 */
export const compareVersions = createServerFn({ method: "GET" })
  .inputValidator((data: CompareVersionsInput) => data)
  .handler(async ({ data, context }): Promise<VersionComparison> => {
    const store = await getOrCreateStore(context.apiBaseUrl);

    const [result, error] = await store.compare({
      from: data.from,
      to: data.to,
      includeFileHashes: data.includeFileHashes ?? true,
      mode: "api",
    } satisfies CompareOptions);

    if (error) {
      throw error;
    }

    return result;
  });

export function compareVersionsQueryOptions(params: CompareVersionsInput) {
  return queryOptions({
    queryKey: ["compare-versions", params.from, params.to, params.includeFileHashes ?? true],
    queryFn: () => compareVersions({ data: params }),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: Boolean(params.from && params.to && params.from !== params.to),
  });
}

export interface ListFilesInput {
  version: string;
}

/**
 * Server function to list files for a specific Unicode version.
 */
export const listVersionFiles = createServerFn({ method: "GET" })
  .inputValidator((data: ListFilesInput) => data)
  .handler(async ({ data, context }): Promise<readonly string[]> => {
    const store = await getOrCreateStore(context.apiBaseUrl);

    const [result, error] = await store.files.list(data.version, {
      allowApi: true,
    });

    if (error) {
      throw error;
    }

    return result;
  });

export function listVersionFilesQueryOptions(version: string) {
  return queryOptions({
    queryKey: ["version-files", version],
    queryFn: () => listVersionFiles({ data: { version } }),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: Boolean(version),
  });
}

export interface GetFileInput {
  version: string;
  path: string;
}

/**
 * Server function to get a specific file from a Unicode version.
 */
export const getVersionFile = createServerFn({ method: "GET" })
  .inputValidator((data: GetFileInput) => data)
  .handler(async ({ data, context }): Promise<string> => {
    const store = await getOrCreateStore(context.apiBaseUrl);

    const [result, error] = await store.files.get(data.version, data.path, {
      allowApi: true,
    });

    if (error) {
      throw error;
    }

    return result;
  });

export function getVersionFileQueryOptions(version: string, path: string) {
  return queryOptions({
    queryKey: ["version-file", version, path],
    queryFn: () => getVersionFile({ data: { version, path } }),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: Boolean(version && path),
  });
}
