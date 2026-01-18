export interface CacheKey {
  /**
   * The route ID that produced this cache entry.
   */
  routeId: string;

  /**
   * The Unicode version being processed.
   */
  version: string;

  /**
   * Hash of the input file content.
   */
  inputHash: string;

  /**
   * Hashes of artifact dependencies used by this route.
   * Key is artifact ID, value is the artifact's content hash.
   */
  artifactHashes: Record<string, string>;
}

export type SerializedCacheKey = `${string}|${string}|${string}|${string}`;

export interface CacheEntry<TOutput = unknown> {
  /**
   * The cache key that identifies this entry.
   */
  key: CacheKey;

  /**
   * The cached output data.
   */
  output: TOutput[];

  /**
   * Artifacts produced by this route during execution.
   * Key is artifact ID, value is the serialized artifact.
   */
  producedArtifacts: Record<string, unknown>;

  /**
   * Timestamp when this entry was created (ISO 8601).
   */
  createdAt: string;

  /**
   * Optional metadata about the cache entry.
   */
  meta?: Record<string, unknown>;
}

export interface CacheStore {
  /**
   * Retrieve a cached entry by key.
   * Returns undefined if not found.
   */
  get: (key: CacheKey) => Promise<CacheEntry | undefined>;

  /**
   * Store a cache entry.
   */
  set: (entry: CacheEntry) => Promise<void>;

  /**
   * Check if a cache entry exists for the given key.
   */
  has: (key: CacheKey) => Promise<boolean>;

  /**
   * Delete a cache entry by key.
   * Returns true if the entry existed and was deleted.
   */
  delete: (key: CacheKey) => Promise<boolean>;

  /**
   * Clear all cache entries.
   */
  clear: () => Promise<void>;
}

export function serializeCacheKey(key: CacheKey): SerializedCacheKey {
  const artifactHashStr = Object.entries(key.artifactHashes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, hash]) => `${id}:${hash}`)
    .join(",");

  return `${key.routeId}|${key.version}|${key.inputHash}|${artifactHashStr}` as SerializedCacheKey;
}

export function deserializeCacheKey(serialized: SerializedCacheKey): CacheKey {
  const [routeId, version, inputHash, artifactHashStr] = serialized.split("|") as [
    string,
    string,
    string,
    string
  ]

  const artifactHashes: Record<string, string> = {};
  if (artifactHashStr) {
    for (const pair of artifactHashStr.split(",")) {
      const [id, hash] = pair.split(":");
      artifactHashes[id!] = hash!;
    }
  }

  return {
    routeId,
    version,
    inputHash,
    artifactHashes,
  };
}

export function areCacheKeysEqual(a: CacheKey, b: CacheKey): boolean {
  if (a.routeId !== b.routeId) return false;
  if (a.version !== b.version) return false;
  if (a.inputHash !== b.inputHash) return false;

  const aKeys = Object.keys(a.artifactHashes).sort();
  const bKeys = Object.keys(b.artifactHashes).sort();
  if (aKeys.length !== bKeys.length) return false;

  for (let i = 0; i < aKeys.length; i++) {
    const key = aKeys[i]!;
    if (key !== bKeys[i]) return false;
    if (a.artifactHashes[key] !== b.artifactHashes[key]) return false;
  }

  return true;
}

export function defineCacheStore(store: CacheStore): CacheStore {
  return store;
}
