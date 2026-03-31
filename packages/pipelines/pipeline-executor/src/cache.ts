export interface CacheKey {
  routeId: string;
  version: string;
  inputHash: string;
  artifactHashes: Record<string, string>;
}

export interface CacheEntry<TOutput = unknown> {
  key: CacheKey;
  output: TOutput[];
  producedArtifacts: Record<string, unknown>;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export function serializeCacheKey(key: CacheKey): string {
  const artifactHashStr = Object.entries(key.artifactHashes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, hash]) => `${id}:${hash}`)
    .join(",");

  return `${key.routeId}|${key.version}|${key.inputHash}|${artifactHashStr}`;
}

export interface CacheStore {
  get: (key: CacheKey) => Promise<CacheEntry | undefined>;
  set: (entry: CacheEntry) => Promise<void>;
  has: (key: CacheKey) => Promise<boolean>;
  delete: (key: CacheKey) => Promise<boolean>;
  clear: () => Promise<void>;
  stats?: () => Promise<CacheStats>;
}

export interface CacheStats {
  entries: number;
  sizeBytes?: number;
  hits?: number;
  misses?: number;
}

export interface CacheOptions {
  enabled?: boolean;
  hashFn?: (content: string) => string;
}

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

export function defaultHashFn(content: string): string {
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash) ^ content.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function hashArtifact(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "string") {
    return defaultHashFn(value);
  }

  if (value instanceof Map) {
    const entries = [...value.entries()].toSorted(([a], [b]) => String(a).localeCompare(String(b)))
      .map(([k, v]) => `${String(k)}=${String(v)}`)
      .join(";");
    return defaultHashFn(entries);
  }

  if (value instanceof Set) {
    const entries = Array.from(value, String)
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
