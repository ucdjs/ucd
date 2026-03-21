import type { CacheEntry, CacheKey, CacheStore } from "../cache";
import { defaultHashFn } from "../cache";

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
}): Promise<CacheHitResult> {
  const { cacheStore, routeId, version, fileContent } = options;

  const partialKey: CacheKey = {
    routeId,
    version,
    inputHash: defaultHashFn(fileContent),
    artifactHashes: {},
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
): CacheKey {
  return {
    routeId,
    version,
    inputHash: defaultHashFn(fileContent),
    artifactHashes: {},
  };
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
