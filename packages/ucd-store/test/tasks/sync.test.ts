/// <reference types="../../../test-utils/src/matchers/types.d.ts" />

import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { createFileTree, mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { describe, expect, it } from "vitest";
import {
  UCDStoreGenericError,
  UCDStoreVersionNotFoundError,
} from "../../src/errors";
import { sync } from "../../src/tasks/sync";

describe("sync", () => {
  const UNICODE_DATA_CONTENT = "0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;";
  const BLOCKS_CONTENT = "# Blocks-16.0.0.txt\n0000..007F; Basic Latin";

  describe("basic sync operations", () => {
    it("should sync new versions from API to lockfile", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_CONTENT,
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
      });

      const [data, error] = await sync(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.added).toContain("16.0.0");
      expect(data?.added).toContain("15.1.0");
      expect(data?.removed).toHaveLength(0);
      expect(data?.versions).toContain("16.0.0");
      expect(data?.versions).toContain("15.1.0");

      // Verify lockfile was created
      const lockfileExists = await fs.exists(lockfilePath);
      expect(lockfileExists).toBe(true);
    });

    it("should identify unchanged versions already in lockfile", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: {
          lockfileVersion: 1,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          versions: {
            "16.0.0": {
              path: "16.0.0/snapshot.json",
              fileCount: 5,
              totalSize: 1000,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
          },
        },
      });

      const [data, error] = await sync(context);

      expect(error).toBeNull();
      expect(data?.unchanged).toContain("16.0.0");
      expect(data?.added).toContain("15.1.0");
      expect(data?.added).not.toContain("16.0.0");
    });

    it("should return empty result when no versions to sync", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-config.json": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: {
          lockfileVersion: 1,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          versions: {
            "16.0.0": {
              path: "16.0.0/snapshot.json",
              fileCount: 5,
              totalSize: 1000,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
          },
        },
      });

      const [data, error] = await sync(context);

      expect(error).toBeNull();
      expect(data?.added).toHaveLength(0);
      expect(data?.unchanged).toContain("16.0.0");
      // mirrorReport is always present, but versions Map is empty when nothing mirrored
      expect(data?.mirrorReport.versions.size).toBe(0);
    });
  });

  describe("force option", () => {
    it("should re-download all files when force is true", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "new content from API",
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: {
          lockfileVersion: 1,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          versions: {
            "16.0.0": {
              path: "16.0.0/snapshot.json",
              fileCount: 1,
              totalSize: 100,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
          },
        },
        initialFiles: {
          "16.0.0/UnicodeData.txt": "existing content",
        },
      });

      const [data, error] = await sync(context, { force: true });

      expect(error).toBeNull();
      expect(data?.mirrorReport).toBeDefined();
      expect(data?.mirrorReport?.versions.get("16.0.0")?.counts.success).toBe(1);

      // File should be overwritten
      const content = await fs.read("/16.0.0/UnicodeData.txt");
      expect(content).toBe("new content from API");
    });

    it("should skip existing files when force is false (default)", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "new content",
            "Blocks.txt": "new blocks content",
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: {
          lockfileVersion: 1,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          versions: {
            "16.0.0": {
              path: "16.0.0/snapshot.json",
              fileCount: 0, // fileCount 0 triggers re-sync
              totalSize: 0,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
          },
        },
        initialFiles: {
          "16.0.0/UnicodeData.txt": "existing content",
        },
      });

      const [data, error] = await sync(context);

      expect(error).toBeNull();
      expect(data?.mirrorReport?.versions.get("16.0.0")?.counts.skipped).toBe(1);
      expect(data?.mirrorReport?.versions.get("16.0.0")?.counts.success).toBe(1);

      // Existing file should NOT be overwritten
      const content = await fs.read("/16.0.0/UnicodeData.txt");
      expect(content).toBe("existing content");
    });
  });

  describe("version filtering", () => {
    it("should only sync specified versions", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0", "14.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0", "14.0.0"],
      });

      const [data, error] = await sync(context, {
        versions: ["16.0.0"],
      });

      expect(error).toBeNull();
      expect(data?.mirrorReport?.versions.size).toBe(1);
      expect(data?.mirrorReport?.versions.has("16.0.0")).toBe(true);
    });

    it("should throw error for non-existent version", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-config.json": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await sync(context, {
        versions: ["99.0.0"],
      });

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
    });
  });

  describe("removeUnavailable option", () => {
    it("should remove versions not available in API when removeUnavailable is true", async () => {
      mockStoreApi({
        versions: ["16.0.0"], // Only 16.0.0 available, not 15.1.0
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: {
          lockfileVersion: 1,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          versions: {
            "16.0.0": {
              path: "16.0.0/snapshot.json",
              fileCount: 5,
              totalSize: 1000,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
            "15.1.0": {
              path: "15.1.0/snapshot.json",
              fileCount: 5,
              totalSize: 1000,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
          },
        },
      });

      const [data, error] = await sync(context, { removeUnavailable: true });

      expect(error).toBeNull();
      expect(data?.removed).toContain("15.1.0");
      expect(data?.versions).toContain("16.0.0");
      expect(data?.versions).not.toContain("15.1.0");
    });

    it("should keep unavailable versions when removeUnavailable is false (default)", async () => {
      mockStoreApi({
        versions: ["16.0.0"], // Only 16.0.0 available
        responses: {
          "/.well-known/ucd-config.json": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: {
          lockfileVersion: 1,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          versions: {
            "16.0.0": {
              path: "16.0.0/snapshot.json",
              fileCount: 5,
              totalSize: 1000,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
            "15.1.0": {
              path: "15.1.0/snapshot.json",
              fileCount: 5,
              totalSize: 1000,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
          },
        },
      });

      const [data, error] = await sync(context);

      expect(error).toBeNull();
      expect(data?.removed).toHaveLength(0);
      expect(data?.versions).toContain("16.0.0");
      expect(data?.versions).toContain("15.1.0");
    });
  });

  describe("cleanOrphaned option", () => {
    it("should remove orphaned files when cleanOrphaned is true", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: {
          lockfileVersion: 1,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          versions: {
            "16.0.0": {
              path: "16.0.0/snapshot.json",
              fileCount: 0, // Trigger re-sync
              totalSize: 0,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
          },
        },
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/OrphanedFile.txt": "this should be removed",
        },
      });

      const [data, error] = await sync(context, { cleanOrphaned: true });

      expect(error).toBeNull();
      const removed = data?.removedFiles.get("16.0.0");
      expect(removed).toEqual([
        { name: "OrphanedFile.txt", filePath: "/16.0.0/OrphanedFile.txt" },
      ]);

      // Verify orphaned file was removed
      const orphanedExists = await fs.exists("/16.0.0/OrphanedFile.txt");
      expect(orphanedExists).toBe(false);

      // Valid file should still exist
      const validExists = await fs.exists("/16.0.0/UnicodeData.txt");
      expect(validExists).toBe(true);
    });

    it("should not remove any files when cleanOrphaned is false (default)", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: {
          lockfileVersion: 1,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          versions: {
            "16.0.0": {
              path: "16.0.0/snapshot.json",
              fileCount: 0,
              totalSize: 0,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
          },
        },
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/ExtraFile.txt": "this should NOT be removed",
        },
      });

      const [data, error] = await sync(context);

      expect(error).toBeNull();
      expect(data?.removedFiles.size).toBe(0);

      // Extra file should still exist
      const extraExists = await fs.exists("/16.0.0/ExtraFile.txt");
      expect(extraExists).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should fail when filesystem does not support write operations", async () => {
      const readOnlyFs = createMemoryMockFS({
        functions: {
          write: false,
          mkdir: false,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        fs: readOnlyFs,
      });

      const [data, error] = await sync(context);

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("does not support required write operations");
    });

    it("should handle API errors when fetching config", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-config.json": () => {
            return HttpResponse.json(
              { message: "Internal server error", status: 500, timestamp: new Date().toISOString() },
              { status: 500 },
            );
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await sync(context);

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe("lockfile updates", () => {
    it("should preserve existing lockfile entries when adding new versions", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: {
          lockfileVersion: 1,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          versions: {
            "16.0.0": {
              path: "16.0.0/snapshot.json",
              fileCount: 10,
              totalSize: 5000,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
          },
        },
      });

      const [_data, error] = await sync(context);

      expect(error).toBeNull();

      const lockfileContent = await fs.read(lockfilePath);
      const lockfile = JSON.parse(lockfileContent!);

      // Both versions should be in lockfile
      expect(lockfile.versions).toHaveProperty("16.0.0");
      expect(lockfile.versions).toHaveProperty("15.1.0");
    });

    it("should create lockfile with correct structure", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [_data, error] = await sync(context);

      expect(error).toBeNull();

      const lockfileContent = await fs.read(lockfilePath);
      const lockfile = JSON.parse(lockfileContent!);

      expect(lockfile).toHaveProperty("lockfileVersion", 1);
      expect(lockfile).toHaveProperty("versions");
      expect(lockfile.versions["16.0.0"]).toHaveProperty("path");
      expect(lockfile.versions["16.0.0"]).toHaveProperty("fileCount");
      expect(lockfile.versions["16.0.0"]).toHaveProperty("totalSize");
    });
  });

  describe("mirror integration", () => {
    it("should include mirror report in sync result", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_CONTENT,
            "Blocks.txt": BLOCKS_CONTENT,
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await sync(context);

      expect(error).toBeNull();
      expect(data?.mirrorReport).toBeDefined();
      expect(data?.mirrorReport?.versions.size).toBe(1);
      expect(data?.mirrorReport?.versions.get("16.0.0")?.counts.success).toBe(2);
    });

    it("should only mirror versions with fileCount 0 by default", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: {
          lockfileVersion: 1,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          versions: {
            "16.0.0": {
              path: "16.0.0/snapshot.json",
              fileCount: 5, // Has files, should NOT be mirrored
              totalSize: 1000,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
            "15.1.0": {
              path: "15.1.0/snapshot.json",
              fileCount: 0, // No files, should be mirrored
              totalSize: 0,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
          },
        },
      });

      const [data, error] = await sync(context);

      expect(error).toBeNull();
      // Only 15.1.0 should be mirrored (fileCount: 0)
      expect(data?.mirrorReport?.versions.has("15.1.0")).toBe(true);
      expect(data?.mirrorReport?.versions.has("16.0.0")).toBe(false);
    });
  });

  describe("concurrency", () => {
    it("should respect concurrency option", async () => {
      const downloadOrder: string[] = [];

      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "File1.txt": "content 1",
            "File2.txt": "content 2",
            "File3.txt": "content 3",
            "File4.txt": "content 4",
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": async ({ request }) => {
            const url = new URL(request.url);
            const fileName = url.pathname.split("/").pop();
            downloadOrder.push(fileName!);
            await new Promise((resolve) => setTimeout(resolve, 10));
            return HttpResponse.text(`content of ${fileName}`);
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await sync(context, { concurrency: 2 });

      expect(error).toBeNull();
      expect(data?.mirrorReport?.versions.get("16.0.0")?.counts.success).toBe(4);
      expect(downloadOrder).toHaveLength(4);
    });
  });

  describe("filter patterns", () => {
    it("should apply include filter to synced files", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
            "Blocks.txt": "content",
            "Scripts.txt": "content",
            "auxiliary": { "GraphemeBreakProperty.txt": "content" },
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await sync(context, {
        filters: {
          include: ["UnicodeData.txt", "Blocks.txt"],
        },
      });

      expect(error).toBeNull();
      const report = data?.mirrorReport?.versions.get("16.0.0");
      expect(report?.counts.success).toBe(2);
      expect(report?.files.downloaded).toEqual([
        { name: "Blocks.txt", filePath: "/16.0.0/Blocks.txt" },
        { name: "UnicodeData.txt", filePath: "/16.0.0/UnicodeData.txt" },
      ]);
    });

    it("should apply exclude filter to synced files", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
            "Blocks.txt": "content",
            "Scripts.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await sync(context, {
        filters: {
          exclude: ["Scripts.txt"],
        },
      });

      expect(error).toBeNull();
      const report = data?.mirrorReport?.versions.get("16.0.0");
      expect(report?.files.downloaded).toEqual([
        { name: "Blocks.txt", filePath: "/16.0.0/Blocks.txt" },
        { name: "UnicodeData.txt", filePath: "/16.0.0/UnicodeData.txt" },
      ]);
    });
  });

  describe("result structure", () => {
    it("should include timestamp in result", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await sync(context);

      expect(error).toBeNull();
      expect(data?.timestamp).toBeDefined();
      expect(typeof data?.timestamp).toBe("string");
      // Should be a valid ISO timestamp
      expect(() => new Date(data!.timestamp)).not.toThrow();
    });

    it("should correctly categorize added, removed, and unchanged versions", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"], // API has 16.0.0 and 15.1.0
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: {
          lockfileVersion: 1,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          versions: {
            "14.0.0": {
              path: "14.0.0/snapshot.json",
              fileCount: 5,
              totalSize: 1000,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
            "15.1.0": {
              path: "15.1.0/snapshot.json",
              fileCount: 5,
              totalSize: 1000,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
          },
        },
      });

      const [data, error] = await sync(context, { removeUnavailable: true });

      expect(error).toBeNull();
      expect(data?.added).toContain("16.0.0"); // New version from API
      expect(data?.removed).toContain("14.0.0"); // Removed (not in API)
      expect(data?.unchanged).toContain("15.1.0"); // Already existed and still in API
    });
  });
});
