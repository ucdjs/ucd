import { describe, expect, it } from "vitest";
import {
  type CacheEntry,
  type CacheKey,
  createMemoryCacheStore,
  defaultHashFn,
  hashArtifact,
  serializeCacheKey,
} from "../src/cache";

describe("CacheKey", () => {
  it("should serialize cache key correctly", () => {
    const key: CacheKey = {
      routeId: "line-break",
      version: "16.0.0",
      inputHash: "abc123",
      artifactHashes: { names: "def456", blocks: "ghi789" },
    };

    const serialized = serializeCacheKey(key);
    expect(serialized).toBe("line-break|16.0.0|abc123|blocks:ghi789,names:def456");
  });

  it("should serialize cache key with empty artifact hashes", () => {
    const key: CacheKey = {
      routeId: "simple-route",
      version: "15.0.0",
      inputHash: "xyz",
      artifactHashes: {},
    };

    const serialized = serializeCacheKey(key);
    expect(serialized).toBe("simple-route|15.0.0|xyz|");
  });

  it("should sort artifact hashes alphabetically", () => {
    const key: CacheKey = {
      routeId: "test",
      version: "1.0.0",
      inputHash: "hash",
      artifactHashes: { zebra: "z", alpha: "a", middle: "m" },
    };

    const serialized = serializeCacheKey(key);
    expect(serialized).toBe("test|1.0.0|hash|alpha:a,middle:m,zebra:z");
  });
});

describe("defaultHashFn", () => {
  it("should return consistent hash for same input", () => {
    const input = "Hello, World!";
    const hash1 = defaultHashFn(input);
    const hash2 = defaultHashFn(input);
    expect(hash1).toBe(hash2);
  });

  it("should return different hashes for different inputs", () => {
    const hash1 = defaultHashFn("Hello");
    const hash2 = defaultHashFn("World");
    expect(hash1).not.toBe(hash2);
  });

  it("should return 8-character hex string", () => {
    const hash = defaultHashFn("test input");
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("should handle empty string", () => {
    const hash = defaultHashFn("");
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("hashArtifact", () => {
  it("should hash null/undefined as 'null'", () => {
    expect(hashArtifact(null)).toBe("null");
    expect(hashArtifact(undefined)).toBe("null");
  });

  it("should hash strings", () => {
    const hash = hashArtifact("test string");
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("should hash Map consistently", () => {
    const map1 = new Map([
      ["a", "1"],
      ["b", "2"],
    ]);
    const map2 = new Map([
      ["b", "2"],
      ["a", "1"],
    ]);

    expect(hashArtifact(map1)).toBe(hashArtifact(map2));
  });

  it("should hash Set consistently", () => {
    const set1 = new Set(["a", "b", "c"]);
    const set2 = new Set(["c", "a", "b"]);

    expect(hashArtifact(set1)).toBe(hashArtifact(set2));
  });

  it("should hash arrays", () => {
    const arr = [1, 2, 3];
    const hash = hashArtifact(arr);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("should hash objects", () => {
    const obj = { foo: "bar", baz: 123 };
    const hash = hashArtifact(obj);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("createMemoryCacheStore", () => {
  it("should store and retrieve cache entries", async () => {
    const store = createMemoryCacheStore();
    const key: CacheKey = {
      routeId: "test",
      version: "1.0.0",
      inputHash: "abc",
      artifactHashes: {},
    };

    const entry: CacheEntry = {
      key,
      output: [{ data: "test" }],
      producedArtifacts: {},
      createdAt: new Date().toISOString(),
    };

    await store.set(entry);
    const retrieved = await store.get(key);

    expect(retrieved).toEqual(entry);
  });

  it("should return undefined for missing entries", async () => {
    const store = createMemoryCacheStore();
    const key: CacheKey = {
      routeId: "nonexistent",
      version: "1.0.0",
      inputHash: "xyz",
      artifactHashes: {},
    };

    const result = await store.get(key);
    expect(result).toBeUndefined();
  });

  it("should check existence with has()", async () => {
    const store = createMemoryCacheStore();
    const key: CacheKey = {
      routeId: "test",
      version: "1.0.0",
      inputHash: "abc",
      artifactHashes: {},
    };

    expect(await store.has(key)).toBe(false);

    await store.set({
      key,
      output: [],
      producedArtifacts: {},
      createdAt: new Date().toISOString(),
    });

    expect(await store.has(key)).toBe(true);
  });

  it("should delete entries", async () => {
    const store = createMemoryCacheStore();
    const key: CacheKey = {
      routeId: "test",
      version: "1.0.0",
      inputHash: "abc",
      artifactHashes: {},
    };

    await store.set({
      key,
      output: [],
      producedArtifacts: {},
      createdAt: new Date().toISOString(),
    });

    expect(await store.delete(key)).toBe(true);
    expect(await store.has(key)).toBe(false);
    expect(await store.delete(key)).toBe(false);
  });

  it("should clear all entries", async () => {
    const store = createMemoryCacheStore();

    for (let i = 0; i < 3; i++) {
      await store.set({
        key: {
          routeId: `route-${i}`,
          version: "1.0.0",
          inputHash: `hash-${i}`,
          artifactHashes: {},
        },
        output: [],
        producedArtifacts: {},
        createdAt: new Date().toISOString(),
      });
    }

    const statsBefore = await store.stats?.();
    expect(statsBefore?.entries).toBe(3);

    await store.clear();

    const statsAfter = await store.stats?.();
    expect(statsAfter?.entries).toBe(0);
  });

  it("should track hits and misses", async () => {
    const store = createMemoryCacheStore();
    const key: CacheKey = {
      routeId: "test",
      version: "1.0.0",
      inputHash: "abc",
      artifactHashes: {},
    };

    await store.get(key);
    await store.get(key);

    await store.set({
      key,
      output: [],
      producedArtifacts: {},
      createdAt: new Date().toISOString(),
    });

    await store.get(key);
    await store.get(key);
    await store.get(key);

    const stats = await store.stats?.();
    expect(stats?.misses).toBe(2);
    expect(stats?.hits).toBe(3);
  });
});
