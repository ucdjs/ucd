/**
 * Unique identifier for a cache entry.
 * Composed of route ID, version, input hash, and artifact dependency hashes.
 */
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

/**
 * A cached result from a route execution.
 */
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

/**
 * Converts a CacheKey to a string for storage lookup.
 */
export function serializeCacheKey(key: CacheKey): string {
  const artifactHashStr = Object.entries(key.artifactHashes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, hash]) => `${id}:${hash}`)
    .join(",");

  return `${key.routeId}|${key.version}|${key.inputHash}|${artifactHashStr}`;
}

/**
 * Pluggable cache store interface.
 * Implementations can use different backends (memory, filesystem, remote).
 */
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

  /**
   * Get cache statistics (optional).
   */
  stats?: () => Promise<CacheStats>;
}

/**
 * Statistics about the cache store.
 */
export interface CacheStats {
  /**
   * Total number of entries in the cache.
   */
  entries: number;

  /**
   * Total size of cached data in bytes (if available).
   */
  sizeBytes?: number;

  /**
   * Number of cache hits since last clear.
   */
  hits?: number;

  /**
   * Number of cache misses since last clear.
   */
  misses?: number;
}

/**
 * Options for cache behavior.
 */
export interface CacheOptions {
  /**
   * Whether caching is enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Custom hash function for content.
   * Defaults to a simple hash based on content length and sample.
   */
  hashFn?: (content: string) => string;
}

/**
 * Simple in-memory cache store implementation.
 */
export function createMemoryCacheStore(): CacheStore {
  const cache = new Map<string, CacheEntry>();
  let hits = 0;
  let misses = 0;

  return {
    async get(key: CacheKey): Promise<CacheEntry | undefined> {
      const serialized = serializeCacheKey(key);
      const entry = cache.get(serialized);
      if (entry) {
        hits++;
      } else {
        misses++;
      }
      return entry;
    },

    async set(entry: CacheEntry): Promise<void> {
      const serialized = serializeCacheKey(entry.key);
      cache.set(serialized, entry);
    },

    async has(key: CacheKey): Promise<boolean> {
      const serialized = serializeCacheKey(key);
      return cache.has(serialized);
    },

    async delete(key: CacheKey): Promise<boolean> {
      const serialized = serializeCacheKey(key);
      return cache.delete(serialized);
    },

    async clear(): Promise<void> {
      cache.clear();
      hits = 0;
      misses = 0;
    },

    async stats(): Promise<CacheStats> {
      return {
        entries: cache.size,
        hits,
        misses,
      };
    },
  };
}

/**
 * Default hash function for content.
 * Uses a simple but fast algorithm suitable for cache keys.
 */
export function defaultHashFn(content: string): string {
  // Simple djb2-like hash
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash) ^ content.charCodeAt(i);
  }
  // Convert to unsigned 32-bit and then to hex
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Hash an artifact value for cache key purposes.
 * Handles different types of artifact values.
 */
export function hashArtifact(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "string") {
    return defaultHashFn(value);
  }

  if (value instanceof Map) {
    const entries = Array.from(value.entries())
      .sort(([a], [b]) => String(a).localeCompare(String(b)))
      .map(([k, v]) => `${String(k)}=${String(v)}`)
      .join(";");
    return defaultHashFn(entries);
  }

  if (value instanceof Set) {
    const entries = Array.from(value)
      .map(String)
      .sort()
      .join(";");
    return defaultHashFn(entries);
  }

  if (Array.isArray(value)) {
    return defaultHashFn(JSON.stringify(value));
  }

  if (typeof value === "object") {
    return defaultHashFn(JSON.stringify(value));
  }

  return defaultHashFn(String(value));
}
