import type { CacheEntry, CacheKey, CacheStore } from "../src/cache";
import { beforeEach, describe, expect, it } from "vitest";
import {

  createMemoryCacheStore,
  defaultHashFn,
  hashArtifact,
  serializeCacheKey,
} from "../src/cache";

describe("serializeCacheKey", () => {
  it("should serialize a simple cache key", () => {
    const key: CacheKey = {
      routeId: "my-route",
      version: "16.0.0",
      inputHash: "abc123",
      artifactHashes: {},
    };

    const serialized = serializeCacheKey(key);

    expect(serialized).toBe("my-route|16.0.0|abc123|");
  });

  it("should serialize cache key with artifact hashes", () => {
    const key: CacheKey = {
      routeId: "my-route",
      version: "16.0.0",
      inputHash: "abc123",
      artifactHashes: {
        "route1:artifact1": "hash1",
        "route2:artifact2": "hash2",
      },
    };

    const serialized = serializeCacheKey(key);

    expect(serialized).toContain("my-route|16.0.0|abc123|");
    expect(serialized).toContain("route1:artifact1:hash1");
    expect(serialized).toContain("route2:artifact2:hash2");
  });

  it("should sort artifact hashes alphabetically", () => {
    const key: CacheKey = {
      routeId: "route",
      version: "16.0.0",
      inputHash: "hash",
      artifactHashes: {
        zebra: "z",
        alpha: "a",
        beta: "b",
      },
    };

    const serialized = serializeCacheKey(key);

    expect(serialized).toBe("route|16.0.0|hash|alpha:a,beta:b,zebra:z");
  });

  it("should produce same result for same key", () => {
    const key: CacheKey = {
      routeId: "route",
      version: "16.0.0",
      inputHash: "hash",
      artifactHashes: { a: "1", b: "2" },
    };

    expect(serializeCacheKey(key)).toBe(serializeCacheKey(key));
  });

  it("should produce different results for different keys", () => {
    const key1: CacheKey = {
      routeId: "route1",
      version: "16.0.0",
      inputHash: "hash",
      artifactHashes: {},
    };
    const key2: CacheKey = {
      routeId: "route2",
      version: "16.0.0",
      inputHash: "hash",
      artifactHashes: {},
    };

    expect(serializeCacheKey(key1)).not.toBe(serializeCacheKey(key2));
  });
});

describe("defaultHashFn", () => {
  it("should hash a string", () => {
    const hash = defaultHashFn("hello world");

    expect(typeof hash).toBe("string");
    expect(hash.length).toBe(8);
  });

  it("should produce same hash for same input", () => {
    const input = "test string";

    expect(defaultHashFn(input)).toBe(defaultHashFn(input));
  });

  it("should produce different hashes for different inputs", () => {
    expect(defaultHashFn("hello")).not.toBe(defaultHashFn("world"));
  });

  it("should handle empty string", () => {
    const hash = defaultHashFn("");

    expect(typeof hash).toBe("string");
    expect(hash.length).toBe(8);
  });

  it("should handle long strings", () => {
    const longString = "a".repeat(10000);
    const hash = defaultHashFn(longString);

    expect(typeof hash).toBe("string");
    expect(hash.length).toBe(8);
  });

  it("should handle unicode strings", () => {
    const hash = defaultHashFn("こんにちは世界");

    expect(typeof hash).toBe("string");
    expect(hash.length).toBe(8);
  });
});

describe("hashArtifact", () => {
  it("should hash null as 'null'", () => {
    expect(hashArtifact(null)).toBe("null");
  });

  it("should hash undefined as 'null'", () => {
    expect(hashArtifact(undefined)).toBe("null");
  });

  it("should hash strings using defaultHashFn", () => {
    const value = "test string";
    expect(hashArtifact(value)).toBe(defaultHashFn(value));
  });

  it("should hash numbers", () => {
    const hash = hashArtifact(42);

    expect(typeof hash).toBe("string");
    expect(hash.length).toBe(8);
  });

  it("should hash booleans", () => {
    const trueHash = hashArtifact(true);
    const falseHash = hashArtifact(false);

    expect(trueHash).not.toBe(falseHash);
  });

  it("should hash arrays", () => {
    const hash = hashArtifact([1, 2, 3]);

    expect(typeof hash).toBe("string");
    expect(hash.length).toBe(8);
  });

  it("should hash objects", () => {
    const hash = hashArtifact({ a: 1, b: 2 });

    expect(typeof hash).toBe("string");
    expect(hash.length).toBe(8);
  });

  it("should hash Maps", () => {
    const map = new Map([
      ["key1", "value1"],
      ["key2", "value2"],
    ]);
    const hash = hashArtifact(map);

    expect(typeof hash).toBe("string");
    expect(hash.length).toBe(8);
  });

  it("should hash Sets", () => {
    const set = new Set(["a", "b", "c"]);
    const hash = hashArtifact(set);

    expect(typeof hash).toBe("string");
    expect(hash.length).toBe(8);
  });

  it("should produce same hash for equivalent objects", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 2 };

    expect(hashArtifact(obj1)).toBe(hashArtifact(obj2));
  });

  it("should produce different hashes for different objects", () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 2 };

    expect(hashArtifact(obj1)).not.toBe(hashArtifact(obj2));
  });

  it("should sort Map entries for consistent hashing", () => {
    const map1 = new Map([
      ["b", "2"],
      ["a", "1"],
    ]);
    const map2 = new Map([
      ["a", "1"],
      ["b", "2"],
    ]);

    expect(hashArtifact(map1)).toBe(hashArtifact(map2));
  });

  it("should sort Set entries for consistent hashing", () => {
    const set1 = new Set(["c", "a", "b"]);
    const set2 = new Set(["a", "b", "c"]);

    expect(hashArtifact(set1)).toBe(hashArtifact(set2));
  });
});

describe("createMemoryCacheStore", () => {
  let store: CacheStore;

  beforeEach(() => {
    store = createMemoryCacheStore();
  });

  function createCacheKey(overrides: Partial<CacheKey> = {}): CacheKey {
    return {
      routeId: "test-route",
      version: "16.0.0",
      inputHash: "testhash",
      artifactHashes: {},
      ...overrides,
    };
  }

  function createCacheEntry(key: CacheKey, output: unknown[] = []): CacheEntry {
    return {
      key,
      output,
      producedArtifacts: {},
      createdAt: new Date().toISOString(),
    };
  }

  describe("get", () => {
    it("should return undefined for non-existent key", async () => {
      const key = createCacheKey();
      const result = await store.get(key);

      expect(result).toBeUndefined();
    });

    it("should return entry for existing key", async () => {
      const key = createCacheKey();
      const entry = createCacheEntry(key, ["output"]);

      await store.set(entry);
      const result = await store.get(key);

      expect(result).toEqual(entry);
    });
  });

  describe("set", () => {
    it("should store an entry", async () => {
      const key = createCacheKey();
      const entry = createCacheEntry(key, ["data"]);

      await store.set(entry);
      const result = await store.get(key);

      expect(result).toEqual(entry);
    });

    it("should overwrite existing entry", async () => {
      const key = createCacheKey();
      const entry1 = createCacheEntry(key, ["first"]);
      const entry2 = createCacheEntry(key, ["second"]);

      await store.set(entry1);
      await store.set(entry2);
      const result = await store.get(key);

      expect(result?.output).toEqual(["second"]);
    });

    it("should store entries with different keys separately", async () => {
      const key1 = createCacheKey({ routeId: "route1" });
      const key2 = createCacheKey({ routeId: "route2" });
      const entry1 = createCacheEntry(key1, ["data1"]);
      const entry2 = createCacheEntry(key2, ["data2"]);

      await store.set(entry1);
      await store.set(entry2);

      expect((await store.get(key1))?.output).toEqual(["data1"]);
      expect((await store.get(key2))?.output).toEqual(["data2"]);
    });
  });

  describe("has", () => {
    it("should return false for non-existent key", async () => {
      const key = createCacheKey();

      expect(await store.has(key)).toBe(false);
    });

    it("should return true for existing key", async () => {
      const key = createCacheKey();
      const entry = createCacheEntry(key);

      await store.set(entry);

      expect(await store.has(key)).toBe(true);
    });
  });

  describe("delete", () => {
    it("should return false for non-existent key", async () => {
      const key = createCacheKey();

      expect(await store.delete(key)).toBe(false);
    });

    it("should return true and remove existing key", async () => {
      const key = createCacheKey();
      const entry = createCacheEntry(key);

      await store.set(entry);
      const deleted = await store.delete(key);

      expect(deleted).toBe(true);
      expect(await store.has(key)).toBe(false);
    });
  });

  describe("clear", () => {
    it("should remove all entries", async () => {
      const key1 = createCacheKey({ routeId: "route1" });
      const key2 = createCacheKey({ routeId: "route2" });

      await store.set(createCacheEntry(key1));
      await store.set(createCacheEntry(key2));
      await store.clear();

      expect(await store.has(key1)).toBe(false);
      expect(await store.has(key2)).toBe(false);
    });

    it("should reset stats", async () => {
      const key = createCacheKey();
      await store.set(createCacheEntry(key));
      await store.get(key);
      await store.get(createCacheKey({ routeId: "nonexistent" }));

      await store.clear();

      const stats = await store.stats?.();
      expect(stats?.entries).toBe(0);
      expect(stats?.hits).toBe(0);
      expect(stats?.misses).toBe(0);
    });
  });

  describe("stats", () => {
    it("should track entry count", async () => {
      const key1 = createCacheKey({ routeId: "route1" });
      const key2 = createCacheKey({ routeId: "route2" });

      await store.set(createCacheEntry(key1));
      await store.set(createCacheEntry(key2));

      const stats = await store.stats?.();
      expect(stats?.entries).toBe(2);
    });

    it("should track cache hits", async () => {
      const key = createCacheKey();
      await store.set(createCacheEntry(key));

      await store.get(key);
      await store.get(key);

      const stats = await store.stats?.();
      expect(stats?.hits).toBe(2);
    });

    it("should track cache misses", async () => {
      await store.get(createCacheKey({ routeId: "missing1" }));
      await store.get(createCacheKey({ routeId: "missing2" }));

      const stats = await store.stats?.();
      expect(stats?.misses).toBe(2);
    });

    it("should track hits and misses together", async () => {
      const existingKey = createCacheKey({ routeId: "existing" });
      await store.set(createCacheEntry(existingKey));

      await store.get(existingKey);
      await store.get(createCacheKey({ routeId: "missing" }));
      await store.get(existingKey);

      const stats = await store.stats?.();
      expect(stats?.hits).toBe(2);
      expect(stats?.misses).toBe(1);
    });
  });
});

describe("cache key matching", () => {
  it("should match keys with same artifact hashes", async () => {
    const store = createMemoryCacheStore();

    const key: CacheKey = {
      routeId: "route",
      version: "16.0.0",
      inputHash: "input",
      artifactHashes: {
        dep1: "hash1",
        dep2: "hash2",
      },
    };

    await store.set({
      key,
      output: ["result"],
      producedArtifacts: {},
      createdAt: new Date().toISOString(),
    });

    const sameKey: CacheKey = {
      routeId: "route",
      version: "16.0.0",
      inputHash: "input",
      artifactHashes: {
        dep1: "hash1",
        dep2: "hash2",
      },
    };

    const result = await store.get(sameKey);
    expect(result?.output).toEqual(["result"]);
  });

  it("should not match keys with different artifact hashes", async () => {
    const store = createMemoryCacheStore();

    const key: CacheKey = {
      routeId: "route",
      version: "16.0.0",
      inputHash: "input",
      artifactHashes: {
        dep1: "hash1",
      },
    };

    await store.set({
      key,
      output: ["result"],
      producedArtifacts: {},
      createdAt: new Date().toISOString(),
    });

    const differentKey: CacheKey = {
      routeId: "route",
      version: "16.0.0",
      inputHash: "input",
      artifactHashes: {
        dep1: "different-hash",
      },
    };

    const result = await store.get(differentKey);
    expect(result).toBeUndefined();
  });
});
