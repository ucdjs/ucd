import type { CacheEntry, CacheKey, CacheStore } from "../cache";
import { defaultHashFn, hashArtifact } from "../cache";

export interface CacheHitResult {
  result: {
    outputs: unknown[];
  } | null;
  hit: boolean;
}

export async function tryLoadCachedResult(options: {
  cacheStore: CacheStore;
  routeId: string;
  version: string;
  fileContent: string;
  routeDataMap: Record<string, unknown[]>;
  depends: readonly string[];
}): Promise<CacheHitResult> {
  const { cacheStore, routeId, version, fileContent, routeDataMap, depends } = options;

  const partialKey: CacheKey = {
    routeId,
    version,
    inputHash: defaultHashFn(fileContent),
    artifactHashes: buildDependencyHashes(depends, routeDataMap),
  };

  const cachedEntry = await cacheStore.get(partialKey);
  if (!cachedEntry) {
    return { result: null, hit: false };
  }

  return {
    result: {
      outputs: cachedEntry.output,
    },
    hit: true,
  };
}

export function buildCacheKey(
  routeId: string,
  version: string,
  fileContent: string,
  routeDataMap: Record<string, unknown[]>,
  depends: readonly string[],
): CacheKey {
  return {
    routeId,
    version,
    inputHash: defaultHashFn(fileContent),
    artifactHashes: buildDependencyHashes(depends, routeDataMap),
  };
}

function buildDependencyHashes(
  depends: readonly string[],
  routeDataMap: Record<string, unknown[]>,
): Record<string, string> {
  if (depends.length === 0) {
    return {};
  }

  const hashes: Record<string, string> = {};
  for (const dep of depends) {
    if (dep.startsWith("route:")) {
      const routeId = dep.slice("route:".length);
      hashes[dep] = hashArtifact(routeDataMap[routeId] ?? []);
    }
  }
  return hashes;
}

export async function storeCacheEntry(options: {
  cacheStore: CacheStore;
  cacheKey: CacheKey;
  outputs: unknown[];
}): Promise<void> {
  const { cacheStore, cacheKey, outputs } = options;

  const cacheEntry: CacheEntry = {
    key: cacheKey,
    output: outputs,
    producedArtifacts: {},
    createdAt: new Date().toISOString(),
  };

  await cacheStore.set(cacheEntry);
}
