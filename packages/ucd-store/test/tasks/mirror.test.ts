/// <reference types="../../../test-utils/src/matchers/types.d.ts" />

import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { createFileTree, mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { describe, expect, it } from "vitest";
import {
  UCDStoreGenericError,
} from "../../src/errors";
import { mirror } from "../../src/tasks/mirror";

describe("mirror", () => {
  const UNICODE_DATA_CONTENT = "0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;";
  const BLOCKS_CONTENT = "# Blocks-16.0.0.txt\n0000..007F; Basic Latin";

  describe("basic mirroring", () => {
    it("should mirror files for a single version", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_CONTENT,
            "Blocks.txt": BLOCKS_CONTENT,
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.versions.size).toBe(1);

      const versionReport = data?.versions.get("16.0.0");
      expect(versionReport).toBeDefined();
      expect(versionReport?.counts.downloaded).toBe(2);
      expect(versionReport?.counts.skipped).toBe(0);
      expect(versionReport?.counts.failed).toBe(0);

      // Verify files were written
      const unicodeData = await fs.read("16.0.0/UnicodeData.txt");
      const blocks = await fs.read("16.0.0/Blocks.txt");
      expect(unicodeData).toBe(UNICODE_DATA_CONTENT);
      expect(blocks).toBe(BLOCKS_CONTENT);
    });

    it("should mirror files for multiple versions", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": "UnicodeData content v16",
            "Readme-16.0.0.txt": "Readme v16",
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": "UnicodeData content v15",
            "Readme-15.1.0.txt": "Readme v15",
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.versions.size).toBe(2);

      const report16 = data?.versions.get("16.0.0");
      const report15 = data?.versions.get("15.1.0");

      expect(report16?.counts.downloaded).toBe(2);
      expect(report15?.counts.downloaded).toBe(2);
    });

    it("should return empty report when no versions are configured", async () => {
      const { context } = await createTestContext({
        versions: [],
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.versions.size).toBe(0);
    });
  });

  describe("force option", () => {
    it("should skip existing files when force is false (default)", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "new content",
            "Blocks.txt": "new content",
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "existing content",
        },
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data?.versions.get("16.0.0")?.counts.skipped).toBe(1);
      expect(data?.versions.get("16.0.0")?.counts.downloaded).toBe(1);

      // Existing file should NOT be overwritten
      const existingFile = await fs.read("16.0.0/UnicodeData.txt");
      expect(existingFile).toBe("existing content");
    });

    it("should re-download existing files when force is true", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "new content from API",
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "existing content",
        },
      });

      const [data, error] = await mirror(context, { force: true });

      expect(error).toBeNull();
      expect(data?.versions.get("16.0.0")?.counts.skipped).toBe(0);
      expect(data?.versions.get("16.0.0")?.counts.downloaded).toBe(1);

      // Existing file SHOULD be overwritten
      const updatedFile = await fs.read("16.0.0/UnicodeData.txt");
      expect(updatedFile).toBe("new content from API");
    });
  });

  describe("version filtering", () => {
    it("should only mirror specified versions", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0", "14.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0", "14.0.0"],
      });

      const [data, error] = await mirror(context, {
        versions: ["16.0.0"],
      });

      expect(error).toBeNull();
      expect(data?.versions.size).toBe(1);
      expect(data?.versions.has("16.0.0")).toBe(true);
      expect(data?.versions.has("15.1.0")).toBe(false);
      expect(data?.versions.has("14.0.0")).toBe(false);
    });
  });

  describe("filter patterns", () => {
    it("should apply include filter to file selection", async () => {
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
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await mirror(context, {
        filters: {
          include: ["UnicodeData.txt", "Blocks.txt"],
        },
      });

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      expect(report?.counts.downloaded).toBe(2);
      expect(report?.files.downloaded).toContain("UnicodeData.txt");
      expect(report?.files.downloaded).toContain("Blocks.txt");
      expect(report?.files.downloaded).not.toContain("Scripts.txt");
    });

    it("should apply exclude filter to file selection", async () => {
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
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await mirror(context, {
        filters: {
          exclude: ["Scripts.txt"],
        },
      });

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      expect(report?.files.downloaded).toContain("UnicodeData.txt");
      expect(report?.files.downloaded).toContain("Blocks.txt");
      expect(report?.files.downloaded).not.toContain("Scripts.txt");
    });

    it("should apply glob patterns for filtering", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
            "Blocks.txt": "content",
            "auxiliary": {
              "GraphemeBreakProperty.txt": "content",
              "WordBreakProperty.txt": "content",
            },
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await mirror(context, {
        filters: {
          include: ["auxiliary/**"],
        },
      });

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      expect(report?.files.downloaded).toContain("auxiliary/GraphemeBreakProperty.txt");
      expect(report?.files.downloaded).toContain("auxiliary/WordBreakProperty.txt");
      expect(report?.files.downloaded).not.toContain("UnicodeData.txt");
      expect(report?.files.downloaded).not.toContain("Blocks.txt");
    });
  });

  describe("error handling", () => {
    it("should fail when filesystem does not support write operations", async () => {
      // Create a mock FS without write capabilities
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

      const [data, error] = await mirror(context);

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("does not support required write operations");
    });

    it("should handle API errors when fetching file tree", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions/{version}/file-tree": () => {
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

      const [data, error] = await mirror(context);

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("Failed to fetch file tree");
    });

    it("should track failed downloads in version report", async () => {
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
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": ({ request }) => {
            const url = new URL(request.url);
            if (url.pathname.includes("Blocks.txt")) {
              return HttpResponse.json(
                { message: "File not found", status: 404, timestamp: new Date().toISOString() },
                { status: 404 },
              );
            }
            return HttpResponse.text("content");
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      expect(report?.counts.downloaded).toBe(2);
      expect(report?.counts.failed).toBe(1);
      expect(report?.files.failed).toContain("Blocks.txt");
      expect(report?.errors).toHaveLength(1);
      expect(report?.errors[0]?.file).toBe("Blocks.txt");
    });
  });

  describe("lockfile and snapshot creation", () => {
    it("should create lockfile after mirroring", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_CONTENT,
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Verify lockfile was created
      const lockfileExists = await fs.exists(lockfilePath);
      expect(lockfileExists).toBe(true);

      const lockfileContent = await fs.read(lockfilePath);
      expect(lockfileContent).toBeDefined();

      const lockfile = JSON.parse(lockfileContent!);
      expect(lockfile.versions).toHaveProperty("16.0.0");
      expect(lockfile.versions["16.0.0"]).toHaveProperty("path");
      expect(lockfile.versions["16.0.0"]).toHaveProperty("fileCount");
      expect(lockfile.versions["16.0.0"]).toHaveProperty("totalSize");
    });

    it("should create snapshot for each mirrored version", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_CONTENT,
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [_data, error] = await mirror(context);

      expect(error).toBeNull();

      // Verify snapshot was created
      const snapshotExists = await fs.exists("16.0.0/snapshot.json");
      expect(snapshotExists).toBe(true);

      const snapshotContent = await fs.read("16.0.0/snapshot.json");
      expect(snapshotContent).toBeDefined();

      const snapshot = JSON.parse(snapshotContent!);
      expect(snapshot.unicodeVersion).toBe("16.0.0");
      expect(snapshot.files).toHaveProperty("UnicodeData.txt");
      expect(snapshot.files["UnicodeData.txt"]).toHaveProperty("hash");
      expect(snapshot.files["UnicodeData.txt"]).toHaveProperty("fileHash");
      expect(snapshot.files["UnicodeData.txt"]).toHaveProperty("size");
    });

    it("should update existing lockfile with new version entries", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
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
            "14.0.0": {
              path: "14.0.0/snapshot.json",
              fileCount: 5,
              totalSize: 1000,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
          },
        },
      });

      const [_data, error] = await mirror(context, {
        versions: ["16.0.0"],
      });

      expect(error).toBeNull();

      const lockfileContent = await fs.read(lockfilePath);
      const lockfile = JSON.parse(lockfileContent!);

      // Should have both old and new versions
      expect(lockfile.versions).toHaveProperty("14.0.0");
      expect(lockfile.versions).toHaveProperty("16.0.0");
    });
  });

  describe("summary statistics", () => {
    it("should provide accurate summary counts", async () => {
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
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": ({ request }) => {
            const url = new URL(request.url);
            if (url.pathname.includes("Scripts.txt")) {
              return HttpResponse.json(
                { message: "Internal error", status: 500, timestamp: new Date().toISOString() },
                { status: 500 },
              );
            }
            return HttpResponse.text("content");
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "existing",
        },
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data?.summary).toBeDefined();
      expect(data?.summary?.counts.totalFiles).toBe(3);
      expect(data?.summary?.counts.downloaded).toBe(1); // Blocks.txt
      expect(data?.summary?.counts.skipped).toBe(1); // UnicodeData.txt
      expect(data?.summary?.counts.failed).toBe(1); // Scripts.txt
    });

    it("should calculate metrics correctly", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
            "Blocks.txt": "content",
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "existing",
        },
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data?.summary?.metrics).toBeDefined();
      // 1 downloaded, 1 skipped = 50% success, 50% cache hit
      expect(data?.summary?.metrics.successRate).toBe(50);
      expect(data?.summary?.metrics.cacheHitRate).toBe(50);
      expect(data?.summary?.metrics.failureRate).toBe(0);
    });

    it("should include duration in summary", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data?.summary?.duration).toBeDefined();
      expect(typeof data?.summary?.duration).toBe("number");
      expect(data?.summary?.duration).toBeGreaterThanOrEqual(0);
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
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": async ({ request }) => {
            const url = new URL(request.url);
            const fileName = url.pathname.split("/").pop();
            downloadOrder.push(fileName!);
            // Small delay to make concurrency observable
            await new Promise((resolve) => setTimeout(resolve, 10));
            return HttpResponse.text(`content of ${fileName}`);
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await mirror(context, {
        concurrency: 2,
      });

      expect(error).toBeNull();
      expect(data?.versions.get("16.0.0")?.counts.downloaded).toBe(4);
      // All files should have been downloaded
      expect(downloadOrder).toHaveLength(4);
    });
  });

  describe("directory creation", () => {
    it("should create nested directories for file paths", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            auxiliary: { "GraphemeBreakProperty.txt": "content" },
            extracted: { "DerivedBidiClass.txt": "content" },
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [_data, error] = await mirror(context);

      expect(error).toBeNull();

      // Verify directories were created
      const auxiliaryExists = await fs.exists("16.0.0/auxiliary");
      const extractedExists = await fs.exists("16.0.0/extracted");
      expect(auxiliaryExists).toBe(true);
      expect(extractedExists).toBe(true);

      // Verify files exist in nested directories
      const graphemeFile = await fs.read("16.0.0/auxiliary/GraphemeBreakProperty.txt");
      const bidiFile = await fs.read("16.0.0/extracted/DerivedBidiClass.txt");
      expect(graphemeFile).toBe("content");
      expect(bidiFile).toBe("content");
    });
  });
});
