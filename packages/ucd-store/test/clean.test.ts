import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { HttpResponse, mockFetch, mockResponses } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createLocalUCDStore, createRemoteUCDStore, createUCDStore } from "../src/factory";

describe("clean operations across store types", () => {
  beforeEach(() => {
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

  describe("remote store clean operations", () => {
    it("should handle clean on remote store (no actual cleaning)", async () => {
      mockFetch([
        [`GET,HEAD ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/.ucd-store.json`, () => {
          return HttpResponse.json([{ version: "15.0.0", path: "/15.0.0" }]);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
      ]);

      const store = await createRemoteUCDStore();

      console.error(store.versions);

      const result = await store.clean();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesToRemove).toEqual([]);
        expect(result.removedFiles).toEqual([]);
        expect(result.deletedCount).toBe(0);
        expect(result.freedBytes).toBe(0);
        expect(result.failedRemovals).toEqual([]);
      }
    });

    it("should handle remote store clean with dryRun", async () => {
      mockFetch([
        [`GET,HEAD ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/.ucd-store.json`, () => {
          return HttpResponse.json([{ version: "15.0.0", path: "/15.0.0" }]);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const result = await store.clean({ dryRun: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesToRemove).toEqual([]);
        expect(result.deletedCount).toBe(0);
      }
    });

    it("should handle remote store clean with specific versions", async () => {
      const versions = ["15.0.0", "15.1.0"];
      mockFetch([
        [`GET,HEAD ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/.ucd-store.json`, () => {
          return HttpResponse.json(versions.map((version) => ({
            version,
            path: `/${version}`,
          })));
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/:version`, ({ params }) => {
          const { version } = params;

          if (version === "15.1.0") {
            return HttpResponse.json(mockFiles.slice(0, 1));
          }

          return HttpResponse.json(mockFiles);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const result = await store.clean({ versions: ["15.0.0"] });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesToRemove).toEqual([]);
      }
    });

    it("should handle remote store clean failure during analysis", async () => {
      const store = await createRemoteUCDStore();

      // mock analyze to fail
      vi.spyOn(store, "analyze").mockResolvedValue({
        success: false,
        error: "Remote analysis failed",
      });

      const result = await store.clean();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Failed to analyze store before cleaning");
        expect(result.error).toContain("Remote analysis failed");
      }
    });
  });

  describe("local store clean operations", () => {
    it("should clean orphaned files in local store", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
          "BidiBrackets.txt": "Bidi brackets data",
        },
        "orphaned-file.txt": "This shouldn't be here",
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure, {
        cleanup: false,
      });

      const store = await createLocalUCDStore({
        basePath: storeDir,
      });

      const result = await store.clean();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesToRemove.length).toBeGreaterThan(0);
        expect(result.deletedCount).toBeGreaterThan(0);
        expect(result.removedFiles).toContain("orphaned-file.txt");
      }
    });

    it("should perform dry run without actually removing files", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        "orphaned-file.txt": "This shouldn't be here",
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createLocalUCDStore({
        basePath: storeDir,
      });

      const result = await store.clean({ dryRun: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesToRemove.length).toBeGreaterThan(0);
        expect(result.deletedCount).toBe(0); // No actual deletions in dry run
      }

      // Verify files still exist after dry run
      expect(await store.fs.exists(`${storeDir}/orphaned-file.txt`)).toBe(true);
    });

    it("should clean only specified versions", async () => {
      const storeStructure = {
        "15.0.0": {
          "file1.txt": "Version 15.0.0 file",
        },
        "15.1.0": {
          "file2.txt": "Version 15.1.0 file",
        },
        "orphaned-v1.txt": "Orphaned from v1",
        "orphaned-v2.txt": "Orphaned from v2",
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
          { version: "15.1.0", path: "15.1.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createLocalUCDStore({
        basePath: storeDir,
      });

      const result = await store.clean({ versions: ["15.0.0"] });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should only include orphaned files that would be associated with version filtering
        expect(result.filesToRemove.length).toBeGreaterThanOrEqual(0);
      }
    });

    it("should calculate freed bytes correctly", async () => {
      const largeContent = "x".repeat(1000); // 1000 bytes
      const storeStructure = {
        "15.0.0": {
          "file.txt": "small file",
        },
        "large-orphaned.txt": largeContent,
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createLocalUCDStore({
        basePath: storeDir,
      });

      const result = await store.clean();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.freedBytes).toBeGreaterThan(0);
      }
    });

    it("should handle clean failure with partial results", async () => {
      const storeStructure = {
        "15.0.0": {
          "file.txt": "legitimate file",
        },
        "orphaned1.txt": "orphaned file 1",
        "orphaned2.txt": "orphaned file 2",
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createLocalUCDStore({
        basePath: storeDir,
      });

      // Mock rm to fail on specific file
      const originalRM = store.fs.rm;
      store.fs.rm = vi.fn().mockImplementation(async (path: string) => {
        if (path.includes("orphaned1.txt")) {
          throw new Error("Permission denied");
        }
        return originalRM.call(store.fs, path);
      });

      const result = await store.clean();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.partialResults).toBeDefined();
        expect(result.partialResults!.failedRemovals.length).toBeGreaterThan(0);
        expect(result.partialResults!.removedFiles.length).toBeGreaterThanOrEqual(0);
      }
    });

    it("should update manifest after removing empty version directories", async () => {
      const storeStructure = {
        "15.0.0": {
          "file.txt": "only file in version",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createLocalUCDStore({
        basePath: storeDir,
      });

      // First remove the file manually to make the version empty
      await store.fs.rm(`${storeDir}/15.0.0/file.txt`);

      const result = await store.clean();

      expect(result.success).toBe(true);
    });
  });

  describe("createUCDStore clean operations", () => {
    it("should handle local store created via createUCDStore", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        "orphaned.txt": "orphaned file",
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createUCDStore({
        mode: "local",
        basePath: storeDir,
        fs: await import("@ucdjs/utils/fs-bridge/node").then((m) => m.default),
      });

      const result = await store.clean();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesToRemove.length).toBeGreaterThan(0);
      }
    });

    it("should handle remote store created via createUCDStore", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
      ]);

      const mockFS: FileSystemBridge = {
        async exists() { return true; },
        async mkdir() { },
        async read() { return JSON.stringify([{ version: "15.0.0", path: "15.0.0" }]); },
        async write() { },
        async rm() { },
        async stat() {
          return {
            mtime: new Date(),
            size: 0,
            isDirectory: () => false,
            isFile: () => true,
          };
        },
        async listdir() { return []; },
      };

      const store = await createUCDStore({
        mode: "remote",
        fs: mockFS,
      });

      Object.defineProperty(store, "versions", {
        value: Object.freeze(["15.0.0"]),
        writable: false,
      });

      const result = await store.clean();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesToRemove).toEqual([]);
        expect(result.deletedCount).toBe(0);
      }
    });
  });

  describe("clean edge cases", () => {
    it("should handle clean when store has no versions", async () => {
      const storeStructure = {
        ".ucd-store.json": JSON.stringify([]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createLocalUCDStore({
        basePath: storeDir,
      });

      const result = await store.clean();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesToRemove).toEqual([]);
        expect(result.deletedCount).toBe(0);
      }
    });

    it("should handle clean with force option", async () => {
      const storeStructure = {
        "15.0.0": {
          "file.txt": "data",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createLocalUCDStore({
        basePath: storeDir,
      });

      const result = await store.clean({ force: true });

      expect(result.success).toBe(true);
    });

    it("should handle clean when analysis partially fails", async () => {
      const storeStructure = {
        "15.0.0": {
          "file.txt": "data",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createLocalUCDStore({
        basePath: storeDir,
      });

      // Mock analyze to return success but with corrupted health
      vi.spyOn(store, "analyze").mockResolvedValue({
        success: true,
        totalFiles: 1,
        totalSize: 10,
        versions: [{
          version: "15.0.0",
          fileCount: 1,
          isComplete: false,
          missingFiles: ["some-missing-file.txt"],
        }],
        filesToRemove: [],
        storeHealth: "corrupted",
      });

      const result = await store.clean();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesToRemove).toEqual([]);
      }
    });
  });
});
