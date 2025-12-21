import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { configure, mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { readLockfile, readSnapshot } from "@ucdjs/lockfile";
import { createEmptyLockfile } from "@ucdjs/lockfile/test-utils";
import { describe, expect, it } from "vitest";
import { mirror } from "../../src/operations/mirror";

describe("mirror", () => {
  describe("basic mirroring", () => {
    it("should mirror all versions by default", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: createEmptyLockfile(["16.0.0", "15.1.0"]),
      });

      // Act
      const [data, error] = await mirror(context);

      // Assert
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.timestamp).toEqual(expect.any(String));

      const versionKeys = [...data!.versions.keys()];
      expect(versionKeys).toEqual(["16.0.0", "15.1.0"]);

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

      expect(data?.summary).toBeDefined();
      expect(data?.summary).toMatchObject({
        counts: {
          downloaded: 6,
          failed: 0,
          skipped: 0,
          totalFiles: 6,
        },
        duration: expect.any(Number),
        metrics: {
          averageTimePerFile: expect.any(Number),
          cacheHitRate: 0,
          failureRate: 0,
          successRate: 100,
        },
        storage: {
          averageFileSize: "20.00 B",
          totalSize: "120.00 B",
        },
      });
    });

    it("should mirror specific versions when provided", async () => {
      // Arrange
      const providedVersions = ["16.0.0", "15.1.0", "15.0.0"];

      mockStoreApi({
        versions: providedVersions,
      });

      const { context } = await createTestContext({
        versions: providedVersions,
        lockfile: createEmptyLockfile(providedVersions),
      });

      // Act
      const [data, error] = await mirror(context, {
        versions: ["16.0.0"],
      });

      // Assert
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
      // Arrange
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act
      const [data, error] = await mirror(context);

      // Assert
      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Check snapshot was created
      const snapshot = await readSnapshot(fs, context.basePath, "16.0.0");
      expect(snapshot.unicodeVersion).toBe("16.0.0");
      expect(Object.keys(snapshot.files).length).toBeGreaterThan(0);

      // Verify all files have hashes
      for (const [_filePath, fileData] of Object.entries(snapshot.files)) {
        expect(fileData.hash).toMatch(/^sha256:[a-f0-9]{64}$/);
        expect(fileData.size).toBeGreaterThan(0);
      }
    });

    it("should update lockfile with snapshot metadata", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act
      const [_data, error] = await mirror(context);

      // Assert
      expect(error).toBeNull();

      const lockfile = await readLockfile(fs, lockfilePath);
      const entry = lockfile.versions["16.0.0"];
      expect(entry).toBeDefined();
      expect(entry?.path).toBe("v16.0.0/snapshot.json");
      expect(entry?.fileCount).toBeGreaterThan(0);
      expect(entry?.totalSize).toBeGreaterThan(0);
    });

    it("should preserve existing lockfile entries for non-mirrored versions", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
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

      // Act
      const [_data, error] = await mirror(context, {
        versions: ["16.0.0"], // Only mirror 16.0.0
      });

      // Assert
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
    it("should support force option to re-download existing files", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            expectedFiles: [
              "cased.txt",
              "common.txt",
              "scripts.txt",
            ],
          },
          "/api/v1/files/{wildcard}": ({ params }) => {
            return HttpResponse.text(`Content of ${params.wildcard}`);
          },
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/v16.0.0/cased.txt": "existing content",
          "/test/v16.0.0/common.txt": "existing content",
          "/test/v16.0.0/scripts.txt": "existing content",
        },
      });

      // Act - First mirror without force
      const [firstMirrorData, firstMirrorError] = await mirror(context, {
        force: false,
      });
      expect(firstMirrorError).toBeNull();
      expect(firstMirrorData).toBeDefined();

      const firstV16 = firstMirrorData!.versions.get("16.0.0")!;
      expect(firstV16.counts.downloaded).toBe(0);
      expect(firstV16.counts.skipped).toBeGreaterThan(0);
      const skippedCount = firstV16.counts.skipped;

      const originalCasedContent = await fs.read("/test/v16.0.0/cased.txt");
      const originalCommonContent = await fs.read("/test/v16.0.0/common.txt");
      const originalScriptsContent = await fs.read("/test/v16.0.0/scripts.txt");

      expect(originalCasedContent).toBe("existing content");
      expect(originalCommonContent).toBe("existing content");
      expect(originalScriptsContent).toBe("existing content");

      // Act - Second mirror with force
      const [secondMirrorData, secondMirrorError] = await mirror(context, {
        force: true,
      });
      expect(secondMirrorError).toBeNull();
      expect(secondMirrorData).toBeDefined();

      const secondV16 = secondMirrorData!.versions.get("16.0.0")!;
      expect(secondV16.files.downloaded.length).toBe(skippedCount);
      expect(secondV16.counts.downloaded).toBe(skippedCount);
      expect(secondV16.counts.skipped).toBe(0);

      const updatedCasedContent = await fs.read("/test/v16.0.0/cased.txt");
      const updatedCommonContent = await fs.read("/test/v16.0.0/common.txt");
      const updatedScriptsContent = await fs.read("/test/v16.0.0/scripts.txt");

      expect(updatedCasedContent).not.toBe(originalCasedContent);
      expect(updatedCommonContent).not.toBe(originalCommonContent);
      expect(updatedScriptsContent).not.toBe(originalScriptsContent);
    });
  });

  describe("concurrency", () => {
    it("should support custom concurrency limit", async () => {
      // Arrange
      const DELAY_MS = 30;
      const FILE_COUNT = 10;
      const CONCURRENCY_LIMIT = 5;

      let currentConcurrent = 0;
      let maxConcurrent = 0;

      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            expectedFiles: Array.from({ length: FILE_COUNT }, (_, i) => `file${i}.txt`),
          },
          "/api/v1/files/{wildcard}": configure({
            response: async () => {
              currentConcurrent++;
              maxConcurrent = Math.max(maxConcurrent, currentConcurrent);

              await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

              currentConcurrent--;
              return HttpResponse.text("file content");
            },
          }),
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act
      const [data, error] = await mirror(context, {
        concurrency: CONCURRENCY_LIMIT,
      });

      // Assert
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.versions.size).toBe(1);

      const v16 = data!.versions.get("16.0.0")!;
      expect(v16.counts.downloaded).toBe(FILE_COUNT);

      expect(maxConcurrent).toBeLessThanOrEqual(CONCURRENCY_LIMIT);
      expect(maxConcurrent).toBeGreaterThanOrEqual(2);
    });
  });
});
