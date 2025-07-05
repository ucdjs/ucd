import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { HttpResponse, mockFetch, mockResponses } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { flattenFilePaths } from "@ucdjs/ucd-store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRemoteUCDStore } from "../../src/store";

// eslint-disable-next-line test/prefer-lowercase-title
describe("Remote UCD Store - Error Handling and Edge Cases", () => {
  let mockFs: FileSystemBridge;

  beforeEach(() => {
    mockFs = {
      exists: vi.fn(),
      read: vi.fn(),
      write: vi.fn(),
      listdir: vi.fn(),
      mkdir: vi.fn(),
      stat: vi.fn(),
      rm: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("network and API Errors", () => {
    it("should handle network connectivity issues", { timeout: 10000 }, async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.error();
        }],
      ]);

      const store = await createRemoteUCDStore();

      await expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow("Failed to fetch");
    });

    it("should handle HTTP 404 errors", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.notFound("Version not found");
        }],
      ]);

      const store = await createRemoteUCDStore();

      await expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow("Version not found");
    });

    it("should handle HTTP 500 errors", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.serverError("Internal server error");
        }],
      ]);

      const store = await createRemoteUCDStore();

      await expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow("Internal server error");
    });

    it("should handle timeout errors", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.error();
        }],
      ]);

      const store = await createRemoteUCDStore();

      await expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow("Failed to fetch");
    });

    it("should handle malformed API responses", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.text("Invalid JSON response");
        }],
      ]);

      const store = await createRemoteUCDStore();

      await expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow();
    });

    it("should handle empty or null responses from API", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(null);
        }],
      ]);

      const store = await createRemoteUCDStore();

      await expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow();
    });
  });

  describe("rate Limiting and Retry Logic", () => {
    it("should handle API rate limiting with retry logic", async () => {
      let retryCount = 0;

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          retryCount++;
          if (retryCount < 3) {
            return mockResponses.tooManyRequests("Rate limit exceeded");
          }
          return mockResponses.json([]);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const result = await store.getFileTree("15.0.0");
      expect(result).toEqual([]);
      expect(retryCount).toBe(3);
    });

    it("should handle remote store error recovery", async () => {
      let attemptCount = 0;
      const testFiles = [{ type: "file", name: "RecoveryFile.txt", path: "/RecoveryFile.txt" }];

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          attemptCount++;
          if (attemptCount < 3) {
            return mockResponses.serverError("Temporary server error");
          }
          return mockResponses.json(testFiles);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const fileTree = await store.getFileTree("15.0.0");
      expect(flattenFilePaths(fileTree)).toEqual(flattenFilePaths(testFiles));
      expect(attemptCount).toBe(3);
    });
  });

  describe("version Validation", () => {
    it("should handle malformed Unicode version strings", async () => {
      const store = await createRemoteUCDStore({
        fs: mockFs,
      });

      expect(store.hasVersion("invalid-version")).toBe(false);
      expect(store.hasVersion("15.0")).toBe(false);
      expect(store.hasVersion("")).toBe(false);
      expect(store.hasVersion("15.0.0.0")).toBe(false);
      expect(store.hasVersion("15.0.0")).toBe(true);
    });

    it("should throw error for non-existent version in getFileTree", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/99.99.99`, () => {
          return mockResponses.notFound("Version not found");
        }],
      ]);

      const store = await createRemoteUCDStore();

      await expect(() => store.getFileTree("99.99.99"))
        .rejects.toThrow("Version '99.99.99' not found in store");
    });
  });

  describe("edge Cases and Special Scenarios", () => {
    it("should handle empty file tree response", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json([]);
        }],
      ]);

      const store = await createRemoteUCDStore();
      const fileTree = await store.getFileTree("15.0.0");

      expect(fileTree).toBeDefined();
      expect(fileTree.length).toBe(0);
    });

    it("should handle initialization errors gracefully", async () => {
      const errorStore = createRemoteUCDStore({
        fs: {
          ...mockFs,
          exists: vi.fn().mockRejectedValue(new Error("Failed to initialize remote store")),
        },
      });

      await expect(() => errorStore).rejects.toThrow("Failed to initialize remote store");
    });
  });
});
