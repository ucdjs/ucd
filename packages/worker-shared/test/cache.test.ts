import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearCacheEntry } from "../src/cache";

const mockDelete = vi.fn();
const mockOpen = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockDelete.mockResolvedValue(true);
  mockOpen.mockResolvedValue({ delete: mockDelete });

  // mock the global caches object
  vi.stubGlobal("caches", { open: mockOpen });
});

describe("clearCacheEntry", () => {
  describe("with string parameter", () => {
    it("should open cache with the provided name when clear function is called", async () => {
      const cacheName = "v1_files";
      const path = "https://api.ucdjs.dev/api/v1/files/16.0.0";

      const clearFn = await clearCacheEntry(cacheName);
      await clearFn(path);

      expect(mockOpen).toHaveBeenCalledWith(cacheName);
      expect(mockOpen).toHaveBeenCalledTimes(1);
    });

    it("should return a function that deletes cache entries with string path", async () => {
      const cacheName = "v1_files";
      const path = "https://api.ucdjs.dev/api/v1/files/16.0.0";

      const clearFn = await clearCacheEntry(cacheName);
      await clearFn(path);

      expect(mockDelete).toHaveBeenCalledWith(expect.objectContaining({ url: path }));
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple string paths with the same clear function", async () => {
      const cacheName = "v1_files";
      const path1 = "https://api.ucdjs.dev/api/v1/files/16.0.0";
      const path2 = "https://api.ucdjs.dev/api/v1/files/15.0.0";

      const clearFn = await clearCacheEntry(cacheName);
      await clearFn(path1);
      await clearFn(path2);

      expect(mockDelete).toHaveBeenCalledWith(expect.objectContaining({ url: path1 }));
      expect(mockDelete).toHaveBeenCalledWith(expect.objectContaining({ url: path2 }));
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });

    it("should work with different cache names", async () => {
      const cacheName1 = "v1_files";
      const cacheName2 = "v1_releases";
      const path = "https://api.ucdjs.dev/api/v1/files/16.0.0";

      const clearFn1 = await clearCacheEntry(cacheName1);
      const clearFn2 = await clearCacheEntry(cacheName2);

      await clearFn1(path);
      await clearFn2(path);

      expect(mockOpen).toHaveBeenCalledWith(cacheName1);
      expect(mockOpen).toHaveBeenCalledWith(cacheName2);
      expect(mockOpen).toHaveBeenCalledTimes(2);
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });
  });

  describe("with Request object parameter", () => {
    it("should return a function that deletes cache entries with Request object", async () => {
      const cacheName = "v1_files";
      const request = new Request("https://api.ucdjs.dev/api/v1/files/16.0.0");

      const clearFn = await clearCacheEntry(cacheName);
      await clearFn(request);

      expect(mockDelete).toHaveBeenCalledWith(request);
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple Request objects with the same clear function", async () => {
      const cacheName = "v1_files";
      const request1 = new Request("https://api.ucdjs.dev/api/v1/files/16.0.0");
      const request2 = new Request("https://api.ucdjs.dev/api/v1/files/15.0.0");

      const clearFn = await clearCacheEntry(cacheName);
      await clearFn(request1);
      await clearFn(request2);

      expect(mockDelete).toHaveBeenCalledWith(request1);
      expect(mockDelete).toHaveBeenCalledWith(request2);
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });

    it("should work with Request objects containing different headers", async () => {
      const cacheName = "v1_files";
      const request = new Request("https://api.ucdjs.dev/api/v1/files/16.0.0", {
        headers: { Authorization: "Bearer token" },
      });

      const clearFn = await clearCacheEntry(cacheName);
      await clearFn(request);

      expect(mockDelete).toHaveBeenCalledWith(request);
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("mixed parameter types", () => {
    it("should handle both string and Request object parameters with the same clear function", async () => {
      const cacheName = "v1_files";
      const stringPath = "https://api.ucdjs.dev/api/v1/files/16.0.0";
      const request = new Request("https://api.ucdjs.dev/api/v1/files/15.0.0");

      const clearFn = await clearCacheEntry(cacheName);
      await clearFn(stringPath);
      await clearFn(request);

      expect(mockDelete).toHaveBeenCalledWith(expect.objectContaining({ url: stringPath }));
      expect(mockDelete).toHaveBeenCalledWith(request);
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });
  });

  describe("error handling", () => {
    it("should propagate errors from cache.open", async () => {
      const cacheName = "invalid_cache";
      const path = "https://api.ucdjs.dev/api/v1/files/16.0.0";
      const error = new Error("Failed to open cache");
      mockOpen.mockRejectedValue(error);

      const clearFn = await clearCacheEntry(cacheName);
      await expect(clearFn(path)).rejects.toThrow("Failed to open cache");
    });

    it("should propagate errors from cache.delete", async () => {
      const cacheName = "v1_files";
      const path = "https://api.ucdjs.dev/api/v1/files/16.0.0";
      const error = new Error("Failed to delete from cache");
      mockDelete.mockRejectedValue(error);

      const clearFn = await clearCacheEntry(cacheName);

      await expect(clearFn(path)).rejects.toThrow("Failed to delete from cache");
    });

    it("should handle invalid URL strings gracefully", async () => {
      const cacheName = "v1_files";
      const invalidUrl = "not-a-valid-url";

      const clearFn = await clearCacheEntry(cacheName);

      // The Request constructor should throw for invalid URLs
      await expect(clearFn(invalidUrl)).rejects.toThrow();
    });
  });

  describe("cache reuse", () => {
    it("should only open cache once per clearCacheEntry call", async () => {
      const cacheName = "v1_files";
      const path1 = "https://api.ucdjs.dev/api/v1/files/16.0.0";
      const path2 = "https://api.ucdjs.dev/api/v1/files/15.0.0";

      const clearFn = await clearCacheEntry(cacheName);
      await clearFn(path1);
      await clearFn(path2);

      // Cache should only be opened once during clearCacheEntry creation
      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });

    it("should open cache separately for each clearCacheEntry call", async () => {
      const cacheName = "v1_files";
      const path = "https://api.ucdjs.dev/api/v1/files/16.0.0";

      const clearFn1 = await clearCacheEntry(cacheName);
      const clearFn2 = await clearCacheEntry(cacheName);

      await clearFn1(path);
      await clearFn2(path);

      // Each clearCacheEntry call should open the cache
      expect(mockOpen).toHaveBeenCalledTimes(2);
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });
  });
});
