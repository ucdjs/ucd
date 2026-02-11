import type { CacheEntry, CacheKey, CacheStore } from "../cache";
import { defaultHashFn, hashArtifact } from "../cache";

export interface CacheHitResult {
  result: {
    outputs: unknown[];
    emittedArtifacts: Record<string, unknown>;
    consumedArtifactIds: string[];
  } | null;
  hit: boolean;
}

export async function tryLoadCachedResult(options: {
  cacheStore: CacheStore;
  routeId: string;
  version: string;
  fileContent: string;
  artifactsMap: Record<string, unknown>;
}): Promise<CacheHitResult> {
  const { cacheStore, routeId, version, fileContent, artifactsMap } = options;

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

  const currentArtifactHashes: Record<string, string> = {};
  for (const id of Object.keys(cachedEntry.key.artifactHashes)) {
    if (id in artifactsMap) {
      currentArtifactHashes[id] = hashArtifact(artifactsMap[id]);
    }
  }

  const artifactHashesMatch = Object.keys(cachedEntry.key.artifactHashes).every(
    (id) => currentArtifactHashes[id] === cachedEntry.key.artifactHashes[id],
  );

  if (!artifactHashesMatch) {
    return { result: null, hit: false };
  }

  return {
    result: {
      outputs: cachedEntry.output,
      emittedArtifacts: cachedEntry.producedArtifacts,
      consumedArtifactIds: Object.keys(cachedEntry.key.artifactHashes),
    },
    hit: true,
  };
}

export async function buildCacheKey(
  routeId: string,
  version: string,
  fileContent: string,
  artifactsMap: Record<string, unknown>,
  consumedArtifactIds: string[],
): Promise<CacheKey> {
  const artifactHashes: Record<string, string> = {};
  for (const id of consumedArtifactIds) {
    if (id in artifactsMap) {
      artifactHashes[id] = hashArtifact(artifactsMap[id]);
    }
  }

  return {
    routeId,
    version,
    inputHash: defaultHashFn(fileContent),
    artifactHashes,
  };
}

export async function storeCacheEntry(options: {
  cacheStore: CacheStore;
  cacheKey: CacheKey;
  outputs: unknown[];
  emittedArtifacts: Record<string, unknown>;
}): Promise<void> {
  const { cacheStore, cacheKey, outputs, emittedArtifacts } = options;

  const cacheEntry: CacheEntry = {
    key: cacheKey,
    output: outputs,
    producedArtifacts: emittedArtifacts,
    createdAt: new Date().toISOString(),
  };

  await cacheStore.set(cacheEntry);
}
