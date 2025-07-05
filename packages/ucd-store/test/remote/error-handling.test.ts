import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { HttpResponse, mockFetch, mockResponses } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { flattenFilePaths } from "@ucdjs/ucd-store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRemoteUCDStore } from "../../src/store";

describe("remote ucd store - error handling", () => {
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
    vi.useRealTimers();
  });

  describe("network and api errors", () => {
    it("should handle network connectivity issues", async () => {
      vi.useFakeTimers();

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.error();
        }],
      ]);

      const store = await createRemoteUCDStore();

      const promise = expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow("Failed to fetch");

      // Fast-forward through any retry delays
      await vi.runAllTimersAsync();

      await promise;
    });

    it("should handle HTTP 404 errors", async () => {
      vi.useFakeTimers();

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json({
            path: "/api/v1/files/15.0.0",
            message: "Version not found",
            status: 404,
            timestamp: new Date().toISOString(),
          }, 404);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const promise = expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow("Version not found");

      // Fast-forward through any retry delays
      await vi.runAllTimersAsync();

      await promise;
    });

    it("should handle HTTP 500 errors", async () => {
      vi.useFakeTimers();

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json({
            path: "/api/v1/files/15.0.0",
            message: "Internal server error",
            status: 500,
            timestamp: new Date().toISOString(),
          }, 500);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const promise = expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow("Internal server error");

      // Fast-forward through any retry delays
      await vi.runAllTimersAsync();

      await promise;
    });

    it("should handle timeout errors", async () => {
      vi.useFakeTimers();

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.error();
        }],
      ]);

      const store = await createRemoteUCDStore();

      const promise = expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow("Failed to fetch");

      // Fast-forward through any retry delays
      await vi.runAllTimersAsync();

      await promise;
    });

    it("should handle malformed api responses", async () => {
      vi.useFakeTimers();

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.text("Invalid JSON response");
        }],
      ]);

      const store = await createRemoteUCDStore();

      const promise = expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow();

      // Fast-forward through any retry delays
      await vi.runAllTimersAsync();

      await promise;
    });

    it("should handle empty or null responses from api", async () => {
      vi.useFakeTimers();

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(null);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const promise = expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow();

      // Fast-forward through any retry delays
      await vi.runAllTimersAsync();

      await promise;
    });
  });

  describe("rate limiting and retry logic", () => {
    it("should handle API rate limiting with retry logic", async () => {
      vi.useFakeTimers();

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

      const promise = store.getFileTree("15.0.0");

      // Fast-forward through retry delays
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toEqual([]);
      expect(retryCount).toBe(3);
    });

    it("should handle remote store error recovery", async () => {
      vi.useFakeTimers();

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

      const promise = store.getFileTree("15.0.0");

      // Fast-forward through retry delays
      await vi.runAllTimersAsync();

      const fileTree = await promise;
      expect(flattenFilePaths(fileTree)).toEqual(flattenFilePaths(testFiles));
      expect(attemptCount).toBe(3);
    });
  });

  describe("version validation", () => {
    it("should handle malformed Unicode version strings", async () => {
      const mockedFs = {
        ...mockFs,
        exists: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        }),
        read: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(JSON.stringify([{
              version: "15.0.0",
              path: "/15.0.0",
            }]));
          }
          return Promise.resolve("");
        }),
      };

      const store = await createRemoteUCDStore({
        fs: mockedFs,
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

  describe("edge cases and special scenarios", () => {
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
