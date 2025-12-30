import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { createReadOnlyBridge } from "#test-utils/fs-bridges";
import { configure, mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { readLockfile, readSnapshot } from "@ucdjs/lockfile";
import { createEmptyLockfile } from "@ucdjs/lockfile/test-utils";
import { describe, expect, it } from "vitest";
import { mirror } from "../../src/tasks/mirror";

describe("mirror", () => {
  describe("basic mirroring", () => {
    it("should mirror all versions when no versions option provided", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "*": Array.from({ length: 3 }, (_, i) => ({
            name: `file${i}.txt`,
            type: "file" as const,
            path: `file${i}.txt`,
            lastModified: Date.now(),
          })),
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: createEmptyLockfile(["16.0.0", "15.1.0"]),
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const versionKeys = [...data!.versions.keys()];
      expect(versionKeys).toEqual(["16.0.0", "15.1.0"]);
    });

    it("should include timestamp in report", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": Array.from({ length: 3 }, (_, i) => ({
            name: `file${i}.txt`,
            type: "file" as const,
            path: `file${i}.txt`,
            lastModified: Date.now(),
          })),
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data?.timestamp).toEqual(expect.any(String));
      expect(new Date(data!.timestamp).getTime()).not.toBeNaN();
    });

    it("should include version report structure", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": Array.from({ length: 3 }, (_, i) => ({
            name: `file${i}.txt`,
            type: "file" as const,
            path: `file${i}.txt`,
            lastModified: Date.now(),
          })),
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const v16 = data!.versions.get("16.0.0")!;
      expect(v16).toMatchObject({
        version: "16.0.0",
        files: {
          downloaded: expect.any(Array),
          skipped: expect.any(Array),
          failed: expect.any(Array),
        },
        counts: {
          downloaded: expect.any(Number),
          skipped: expect.any(Number),
          failed: expect.any(Number),
        },
        errors: expect.any(Array),
      });
    });

    it("should calculate summary counts correctly", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": Array.from({ length: 3 }, (_, i) => ({
            name: `file${i}.txt`,
            type: "file" as const,
            path: `file${i}.txt`,
            lastModified: Date.now(),
          })),
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data?.summary?.counts).toEqual({
        downloaded: 3,
        skipped: 0,
        failed: 0,
        totalFiles: 3,
      });
    });

    it("should calculate success rate correctly", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": Array.from({ length: 10 }, (_, i) => ({
            name: `file${i}.txt`,
            type: "file" as const,
            path: `file${i}.txt`,
            lastModified: Date.now(),
          })),
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data?.summary?.metrics.successRate).toBe(100);
      expect(data?.summary?.metrics.failureRate).toBe(0);
      expect(data?.summary?.metrics.cacheHitRate).toBe(0);
    });

    it("should format storage sizes correctly", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": Array.from({ length: 3 }, (_, i) => ({
            name: `file${i}.txt`,
            type: "file" as const,
            path: `file${i}.txt`,
            lastModified: Date.now(),
          })),
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data?.summary?.storage.totalSize).toBe("60.00 B");
      expect(data?.summary?.storage.averageFileSize).toBe("20.00 B");
    });

    it("should mirror specific versions when provided", async () => {
      const providedVersions = ["16.0.0", "15.1.0", "15.0.0"];

      mockStoreApi({
        versions: providedVersions,
      });

      const { context } = await createTestContext({
        versions: providedVersions,
        lockfile: createEmptyLockfile(providedVersions),
      });

      const [data, error] = await mirror(context, {
        versions: ["16.0.0"],
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const versionKeys = [...data!.versions.keys()];
      expect(versionKeys).toEqual(["16.0.0"]);

      const v16 = data!.versions.get("16.0.0")!;
      expect(v16).toMatchObject({
        version: "16.0.0",
        files: {
          downloaded: expect.any(Array),
          skipped: expect.any(Array),
          failed: expect.any(Array),
        },
        counts: {
          downloaded: expect.any(Number),
          skipped: expect.any(Number),
          failed: expect.any(Number),
        },
        errors: expect.any(Array),
      });
    });
  });

  describe("snapshot creation", () => {
    it("should create snapshots for mirrored versions", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": Array.from({ length: 3 }, (_, i) => ({
            name: `file${i}.txt`,
            type: "file" as const,
            path: `file${i}.txt`,
            lastModified: Date.now(),
          })),
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const snapshot = await readSnapshot(fs, context.basePath, "16.0.0");
      expect(snapshot.unicodeVersion).toBe("16.0.0");
      expect(Object.keys(snapshot.files).length).toBeGreaterThan(0);

      for (const [_filePath, fileData] of Object.entries(snapshot.files)) {
        expect(fileData.hash).toMatch(/^sha256:[a-f0-9]{64}$/);
        expect(fileData.size).toBeGreaterThan(0);
      }
    });

    it("should update lockfile with snapshot metadata", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": Array.from({ length: 3 }, (_, i) => ({
            name: `file${i}.txt`,
            type: "file" as const,
            path: `file${i}.txt`,
            lastModified: Date.now(),
          })),
        },
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [_data, error] = await mirror(context);

      expect(error).toBeNull();

      const lockfile = await readLockfile(fs, lockfilePath);
      const entry = lockfile.versions["16.0.0"];
      expect(entry).toBeDefined();
      expect(entry?.path).toBe("16.0.0/snapshot.json");
      expect(entry?.fileCount).toBeGreaterThan(0);
      expect(entry?.totalSize).toBeGreaterThan(0);
    });

    it("should preserve existing lockfile entries for non-mirrored versions", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "*": Array.from({ length: 3 }, (_, i) => ({
            name: `file${i}.txt`,
            type: "file" as const,
            path: `file${i}.txt`,
            lastModified: Date.now(),
          })),
        },
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: {
          lockfileVersion: 1,
          versions: {
            "16.0.0": {
              path: "v16.0.0/snapshot.json",
              fileCount: 0,
              totalSize: 0,
            },
            "15.1.0": {
              path: "v15.1.0/snapshot.json",
              fileCount: 5,
              totalSize: 500,
            },
          },
        },
      });

      const [_data, error] = await mirror(context, {
        versions: ["16.0.0"], // Only mirror 16.0.0
      });

      expect(error).toBeNull();

      const lockfile = await readLockfile(fs, lockfilePath);
      // 15.1.0 entry should be preserved
      expect(lockfile.versions["15.1.0"]).toEqual({
        path: "v15.1.0/snapshot.json",
        fileCount: 5,
        totalSize: 500,
      });
      // 16.0.0 entry should be updated
      expect(lockfile.versions["16.0.0"]?.fileCount).toBeGreaterThan(0);
    });
  });

  describe("force option", () => {
    it("should skip existing files when force is false", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": [
            {
              name: "file1.txt",
              type: "file" as const,
              path: "file1.txt",
              lastModified: Date.now(),
            },
            {
              name: "file2.txt",
              type: "file" as const,
              path: "file2.txt",
              lastModified: Date.now(),
            },
          ],
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/file1.txt": "existing",
          "/test/16.0.0/file2.txt": "existing",
        },
      });

      const [data, error] = await mirror(context, { force: false });

      expect(error).toBeNull();
      expect(data?.versions.get("16.0.0")?.counts.downloaded).toBe(0);
      expect(data?.versions.get("16.0.0")?.counts.skipped).toBe(2);
    });

    it("should re-download existing files when force is true", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": [
            {
              name: "file1.txt",
              type: "file" as const,
              path: "file1.txt",
              lastModified: Date.now(),
            },
          ],
        },
        responses: {
          "/api/v1/files/{wildcard}": () => HttpResponse.text("new content"),
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/file1.txt": "old content",
        },
      });

      const [data, error] = await mirror(context, { force: true });

      expect(error).toBeNull();
      expect(data?.versions.get("16.0.0")?.counts.downloaded).toBe(1);
      expect(data?.versions.get("16.0.0")?.counts.skipped).toBe(0);

      const content = await fs.read("/test/16.0.0/file1.txt");
      expect(content).toBe("new content");
    });
  });

  describe("concurrency", () => {
    it("should support custom concurrency limit", async () => {
      const DELAY_MS = 30;
      const FILE_COUNT = 10;
      const CONCURRENCY_LIMIT = 5;

      let currentConcurrent = 0;
      let maxConcurrent = 0;

      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": Array.from({ length: FILE_COUNT }, (_, i) => ({
            name: `file${i}.txt`,
            type: "file" as const,
            path: `file${i}.txt`,
            lastModified: Date.now(),
          })),
        },
        responses: {
          "/api/v1/files/{wildcard}": configure({
            response: async () => {
              await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
              return HttpResponse.text("file content");
            },
            before: async () => {
              currentConcurrent++;
              maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
            },
            after: async () => {
              currentConcurrent--;
            },
          }),
          "/api/v1/versions/{version}/file-tree": configure({
            response: true, // Uses default resolver with files option
            before: async () => {
              currentConcurrent++;
              maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
              await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
            },
            after: async () => {
              currentConcurrent--;
            },
          }),
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await mirror(context, {
        concurrency: CONCURRENCY_LIMIT,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.versions.size).toBe(1);

      const v16 = data!.versions.get("16.0.0")!;
      expect(v16.counts.downloaded).toBe(FILE_COUNT);

      expect(maxConcurrent).toBeLessThanOrEqual(CONCURRENCY_LIMIT);
      expect(maxConcurrent).toBeGreaterThanOrEqual(2);
    });
  });

  describe("error handling", () => {
    it("should handle file tree fetch failure", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions/{version}/file-tree": {
            status: 500,
            message: "Internal Server Error",
            timestamp: new Date().toISOString(),
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [_data, error] = await mirror(context);

      expect(error).toBeDefined();
      expect(error?.message).toContain("Failed to fetch file tree");
    });

    it("should handle partial failures", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": [
            {
              name: "file1.txt",
              type: "file" as const,
              path: "file1.txt",
              lastModified: Date.now(),
            },
            {
              name: "file2.txt",
              type: "file" as const,
              path: "file2.txt",
              lastModified: Date.now(),
            },
          ],
        },
        responses: {
          "/api/v1/files/{wildcard}": ({ params }) => {
            if (params.wildcard === "16.0.0/file1.txt") {
              return HttpResponse.text("content");
            }
            return HttpResponse.json({
              status: 500,
              message: "Internal Server Error",
              timestamp: new Date().toISOString(),
            }, { status: 500 });
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      const v16 = data!.versions.get("16.0.0")!;
      // At least one file should succeed and one should fail
      const totalFiles = v16.files.downloaded.length + v16.files.failed.length + v16.files.skipped.length;
      expect(totalFiles).toBeGreaterThan(0);
      expect(v16.errors.length).toBeGreaterThan(0);
    });

    it("should fail when filesystem does not support write operations", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": [
            {
              name: "file1.txt",
              type: "file" as const,
              path: "file1.txt",
              lastModified: Date.now(),
            },
          ],
        },
      });

      const fs = createReadOnlyBridge();
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });
      context.fs = fs;

      const [_data, error] = await mirror(context);

      expect(error).toBeDefined();
      expect(error?.message).toContain("does not support required write operations");
    });

    it("should handle directory creation failure gracefully", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "16.0.0": [
            {
              name: "UnicodeData.txt",
              type: "file" as const,
              path: "UnicodeData.txt",
              lastModified: Date.now(),
            },
          ],
        },
        responses: {
          "/api/v1/files/{wildcard}": "content",
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Make mkdir fail
      const originalMkdir = fs.mkdir;
      fs.mkdir = async () => {
        throw new Error("Directory creation failed");
      };

      const [_data, error] = await mirror(context);

      // Restore original mkdir
      fs.mkdir = originalMkdir;

      expect(error).toBeDefined();
      expect(error?.message).toMatch(/Failed to create directory|Directory creation failed/);
    });
  });

  describe("feature coverage", () => {
    it("should handle JSON response from API", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": [
            {
              name: "file.json",
              type: "file" as const,
              path: "file.json",
              lastModified: Date.now(),
            },
          ],
        },
        responses: {
          "/api/v1/files/{wildcard}": () => {
            return HttpResponse.json({ data: "json content" }, {
              headers: { "content-type": "application/json" },
            }) as any;
          },
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await mirror(context);

      expect(error).toBeNull();
      expect(data?.versions.get("16.0.0")?.counts.downloaded).toBe(1);

      const content = await fs.read("/test/16.0.0/file.json");
      expect(content).toBe("{\"data\":\"json content\"}");
    });

    it("should apply filters during mirroring", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": [
            {
              name: "file1.txt",
              type: "file" as const,
              path: "file1.txt",
              lastModified: Date.now(),
            },
            {
              name: "file2.html",
              type: "file" as const,
              path: "file2.html",
              lastModified: Date.now(),
            },
          ],
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await mirror(context, {
        filters: { include: ["**/*.txt"] },
      });

      expect(error).toBeNull();
      const v16 = data!.versions.get("16.0.0")!;
      expect(v16.files.downloaded).toEqual(["file1.txt"]);
      expect(v16.files.downloaded).not.toContain("file2.html");
    });

    it("should return empty report when versions array is empty", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await mirror(context, {
        versions: [],
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.versions.size).toBe(0);
      expect(data?.summary).toBeUndefined();
    });
  });
});
