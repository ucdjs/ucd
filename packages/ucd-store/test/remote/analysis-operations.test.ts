import { HttpResponse, mockFetch, mockResponses } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRemoteUCDStore } from "../../src/factory";

describe("remote ucd store - analysis operations", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  const mockFiles = [
    {
      type: "file",
      name: "ArabicShaping.txt",
      path: "/ArabicShaping.txt",
      lastModified: 1644920820000,
    },
    {
      type: "file",
      name: "BidiBrackets.txt",
      path: "/BidiBrackets.txt",
      lastModified: 1651584360000,
    },
    {
      type: "directory",
      name: "extracted",
      path: "/extracted/",
      lastModified: 1724676960000,
      children: [
        {
          type: "file",
          name: "DerivedBidiClass.txt",
          path: "/DerivedBidiClass.txt",
          lastModified: 1724609100000,
        },
      ],
    },
  ];

  describe("analyze", () => {
    it("should return correct analysis data for remote store", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
      ]);

      const store = await createRemoteUCDStore();

      // Mock the versions to a single version for testing
      Object.defineProperty(store, "versions", {
        value: Object.freeze(["15.0.0"]),
        writable: false,
      });

      const result = await store.analyze();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.totalFiles).toBe(3); // 3 files in the mockFiles structure
        expect(result.totalSize).toBe(0); // Remote mode doesn't calculate sizes by default
        expect(result.versions).toHaveLength(1);
        expect(result.versions[0]).toEqual({
          version: "15.0.0",
          fileCount: 3,
          isComplete: true,
        });
        expect(result.storeHealth).toBe("healthy");
        expect(result.filesToRemove).toEqual([]);
      }
    });

    it("should handle empty remote stores", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json([]);
        }],
      ]);

      const store = await createRemoteUCDStore();

      Object.defineProperty(store, "versions", {
        value: Object.freeze(["15.0.0"]),
        writable: false,
      });

      const result = await store.analyze();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.totalFiles).toBe(0);
        expect(result.versions[0]).toEqual({
          version: "15.0.0",
          fileCount: 0,
          isComplete: true,
        });
        expect(result.storeHealth).toBe("healthy");
      }
    });

    it("should calculate file counts accurately", async () => {
      const largeFileSet = [
        ...Array.from({ length: 50 }, (_, i) => ({
          type: "file",
          name: `file-${i}.txt`,
          path: `/file-${i}.txt`,
        })),
      ];

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(largeFileSet);
        }],
      ]);

      const store = await createRemoteUCDStore();

      Object.defineProperty(store, "versions", {
        value: Object.freeze(["15.0.0"]),
        writable: false,
      });

      const result = await store.analyze();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.totalFiles).toBe(50);
        expect(result.versions[0]!.fileCount).toBe(50);
      }
    });

    it("should identify incomplete versions when API fails", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.serverError();
        }],
      ]);

      const store = await createRemoteUCDStore();

      Object.defineProperty(store, "versions", {
        value: Object.freeze(["15.0.0"]),
        writable: false,
      });

      const result = await store.analyze();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.versions[0]!.isComplete).toBe(false);
        expect(result.versions[0]!.fileCount).toBe(0);
        expect(result.versions[0]!.missingFiles).toBeDefined();
        expect(result.versions[0]!.missingFiles![0]).toContain("Failed to analyze version");
        expect(result.storeHealth).toBe("corrupted");
      }
    });

    it("should handle analysis with calculateSizes option", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
      ]);

      const store = await createRemoteUCDStore();

      Object.defineProperty(store, "versions", {
        value: Object.freeze(["15.0.0"]),
        writable: false,
      });

      const result = await store.analyze({ calculateSizes: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.versions[0]!.totalSize).toBe(0); // Remote mode returns 0 for file sizes
      }
    });

    it("should handle analysis with checkOrphaned option", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
      ]);

      const store = await createRemoteUCDStore();

      Object.defineProperty(store, "versions", {
        value: Object.freeze(["15.0.0"]),
        writable: false,
      });

      const result = await store.analyze({ checkOrphaned: true });

      expect(result.success).toBe(true);
      if (result.success) {
        // Remote mode doesn't have orphaned files concept
        expect(result.filesToRemove).toEqual([]);
        expect(result.storeHealth).toBe("healthy");
      }
    });

    it("should handle multiple versions", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.1.0`, () => {
          return HttpResponse.json(mockFiles.slice(0, 2));
        }],
      ]);

      const store = await createRemoteUCDStore();

      Object.defineProperty(store, "versions", {
        value: Object.freeze(["15.0.0", "15.1.0"]),
        writable: false,
      });

      const result = await store.analyze();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.totalFiles).toBe(5); // 3 + 2 files
        expect(result.versions).toHaveLength(2);
        expect(result.versions[0]!.version).toBe("15.0.0");
        expect(result.versions[1]!.version).toBe("15.1.0");
        expect(result.versions[0]!.fileCount).toBe(3);
        expect(result.versions[1]!.fileCount).toBe(2);
      }
    });

    it("should handle complete analysis failure", async () => {
      const store = await createRemoteUCDStore();

      Object.defineProperty(store, "versions", {
        value: Object.freeze(["15.0.0"]),
        writable: false,
      });

      // Mock a store that throws an error during analysis
      vi.spyOn(store, "getFilePaths").mockRejectedValue(new Error("Network error"));

      const result = await store.analyze();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Analysis failed");
        expect(result.error).toContain("Network error");
      }
    });
  });

  describe("clean", () => {
    it("should return success for remote store without removing files", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
      ]);

      const store = await createRemoteUCDStore();

      Object.defineProperty(store, "versions", {
        value: Object.freeze(["15.0.0"]),
        writable: false,
      });

      const result = await store.clean();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesToRemove).toEqual([]);
        expect(result.removedFiles).toEqual([]);
        expect(result.deletedCount).toBe(0);
        expect(result.freedBytes).toBe(0);
      }
    });

    it("should handle dry run mode", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
      ]);

      const store = await createRemoteUCDStore();

      Object.defineProperty(store, "versions", {
        value: Object.freeze(["15.0.0"]),
        writable: false,
      });

      const result = await store.clean({ dryRun: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesToRemove).toEqual([]);
        expect(result.removedFiles).toEqual([]);
        expect(result.deletedCount).toBe(0);
      }
    });

    it("should handle clean failure during analysis", async () => {
      const store = await createRemoteUCDStore();

      Object.defineProperty(store, "versions", {
        value: Object.freeze(["15.0.0"]),
        writable: false,
      });

      // Mock analyze to fail
      vi.spyOn(store, "analyze").mockResolvedValue({
        success: false,
        error: "Analysis failed",
      });

      const result = await store.clean();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Failed to analyze store before cleaning");
      }
    });

    it("should handle clean with specific versions", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.1.0`, () => {
          return HttpResponse.json(mockFiles.slice(0, 1));
        }],
      ]);

      const store = await createRemoteUCDStore();

      Object.defineProperty(store, "versions", {
        value: Object.freeze(["15.0.0", "15.1.0"]),
        writable: false,
      });

      const result = await store.clean({ versions: ["15.0.0"] });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesToRemove).toEqual([]);
      }
    });

    it("should handle clean with force option", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
      ]);

      const store = await createRemoteUCDStore();

      Object.defineProperty(store, "versions", {
        value: Object.freeze(["15.0.0"]),
        writable: false,
      });

      const result = await store.clean({ force: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesToRemove).toEqual([]);
      }
    });
  });
});
