import type { MirrorReport } from "../../src/operations/mirror";
import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { readLockfile, writeSnapshot } from "@ucdjs/lockfile";
import { createEmptyLockfile } from "@ucdjs/lockfile/test-utils";
import { describe, expect, it, vi } from "vitest";
import { mirror } from "../../src/operations/mirror";
import { sync } from "../../src/operations/sync";

vi.mock("../../src/operations/mirror", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/operations/mirror")>();
  return {
    ...original,
    mirror: vi.fn(original.mirror),
  };
});

describe("sync", () => {
  describe("version discovery", () => {
    it("should discover versions from API config", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await sync(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.added).toEqual(["15.1.0", "15.0.0"]);
      expect(data?.unchanged).toEqual(["16.0.0"]);
    });

    it("should add discovered versions to lockfile", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [_data, error] = await sync(context);

      expect(error).toBeNull();

      const lockfile = await readLockfile(fs, lockfilePath);
      const versionKeys = Object.keys(lockfile.versions).sort();
      expect(versionKeys).toEqual(["15.1.0", "16.0.0"]);
    });

    it("should create lockfile entries for new versions", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [_data, error] = await sync(context);

      expect(error).toBeNull();

      const lockfile = await readLockfile(fs, lockfilePath);
      const entry = lockfile.versions["15.1.0"];
      expect(entry).toBeDefined();
      expect(entry?.path).toBe("15.1.0/snapshot.json");
      expect(entry?.fileCount).toBeGreaterThanOrEqual(0);
      expect(entry?.totalSize).toBeGreaterThanOrEqual(0);
    });
  });

  describe("removeUnavailable option", () => {
    it("should keep existing versions by default", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await sync(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toMatchObject({
        timestamp: expect.any(String),
        added: ["15.1.0", "15.0.0"],
        removed: [],
        unchanged: ["16.0.0"],
        versions: expect.arrayContaining(["16.0.0", "15.1.0", "15.0.0"]),
      });
      expect(data?.versions).toHaveLength(3);

      const lockfile = await readLockfile(fs, lockfilePath);
      const versionKeys = Object.keys(lockfile.versions).sort();
      expect(versionKeys).toEqual(["15.0.0", "15.1.0", "16.0.0"]);
      expect(lockfile.versions["16.0.0"]?.path).toBe("16.0.0/snapshot.json");
      expect(lockfile.versions["15.1.0"]?.path).toBe("15.1.0/snapshot.json");
      expect(lockfile.versions["15.0.0"]?.path).toBe("15.0.0/snapshot.json");
    });

    it("should keep versions not in API when removeUnavailable is false", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "14.0.0", "15.1.0"],
        lockfile: createEmptyLockfile(["16.0.0", "14.0.0"]),
      });

      const [data, error] = await sync(context, {
        removeUnavailable: false,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toMatchObject({
        timestamp: expect.any(String),
        added: ["15.1.0"],
        removed: [],
        unchanged: ["16.0.0", "14.0.0"],
        versions: expect.arrayContaining(["16.0.0", "15.1.0", "14.0.0"]),
      });
      expect(data?.versions).toHaveLength(3);

      const lockfile = await readLockfile(fs, lockfilePath);
      const versionKeys = Object.keys(lockfile.versions).sort();
      expect(versionKeys).toEqual(["14.0.0", "15.1.0", "16.0.0"]);
    });

    it("should remove versions not in API when removeUnavailable is true", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: createEmptyLockfile(["16.0.0", "15.0.0"]),
      });

      const [data, error] = await sync(context, {
        removeUnavailable: true,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toMatchObject({
        timestamp: expect.any(String),
        added: ["15.1.0"],
        removed: ["15.0.0"],
        unchanged: ["16.0.0"],
        versions: expect.arrayContaining(["16.0.0", "15.1.0"]),
      });
      expect(data?.versions).toHaveLength(2);
      expect(data?.versions).not.toContain("15.0.0");

      const lockfile = await readLockfile(fs, lockfilePath);
      const versionKeys = Object.keys(lockfile.versions).sort();
      expect(versionKeys).toEqual(["15.1.0", "16.0.0"]);
      expect(lockfile.versions).not.toHaveProperty("15.0.0");
    });
  });

  describe("lockfile updates", () => {
    it("should add new versions to lockfile", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await sync(context);

      expect(error).toBeNull();
      expect(data?.added).toEqual(["15.1.0"]);
      expect(data?.unchanged).toEqual(["16.0.0"]);

      const lockfile = await readLockfile(fs, lockfilePath);
      const versionKeys = Object.keys(lockfile.versions).sort();
      expect(versionKeys).toEqual(["15.1.0", "16.0.0"]);
    });

    it("should update existing lockfile entries", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: {
          lockfileVersion: 1,
          versions: {
            "16.0.0": {
              path: "16.0.0/snapshot.json",
              fileCount: 10,
              totalSize: 1024,
            },
          },
        },
      });

      const [_data, error] = await sync(context);

      expect(error).toBeNull();

      const lockfile = await readLockfile(fs, lockfilePath);
      const v16 = lockfile.versions["16.0.0"];
      expect(v16).toBeDefined();
      expect(v16?.fileCount).toBeGreaterThan(0);
      expect(v16?.totalSize).toBeGreaterThan(0);
    });

    it("should set correct metadata in lockfile entries", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [_data, error] = await sync(context);

      expect(error).toBeNull();

      const lockfile = await readLockfile(fs, lockfilePath);
      const v15 = lockfile.versions["15.1.0"];
      expect(v15).toBeDefined();
      expect(v15?.path).toBe("15.1.0/snapshot.json");
      expect(v15?.fileCount).toBeGreaterThan(0);
      expect(v15?.totalSize).toBeGreaterThan(0);
    });
  });

  describe("mirror integration", () => {
    it("should automatically mirror files for synced versions", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const mockMirrorReport: MirrorReport = {
        timestamp: new Date().toISOString(),
        versions: new Map([
          [
            "15.1.0",
            {
              version: "15.1.0",
              counts: { downloaded: 5, skipped: 0, failed: 0 },
              files: {
                downloaded: [],
                skipped: [],
                failed: [],
              },
              metrics: {
                cacheHitRate: 0,
                failureRate: 0,
                successRate: 100,
              },
              errors: [],
            },
          ],
        ]),
      };

      vi.mocked(mirror).mockResolvedValueOnce([mockMirrorReport, null]);

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await sync(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.added).toEqual(["15.1.0"]);
      expect(data?.mirrorReport).toBeDefined();
      expect(data?.mirrorReport).toEqual(mockMirrorReport);
      expect(mirror).toHaveBeenCalledWith(context, {
        versions: ["16.0.0", "15.1.0"],
        concurrency: 5,
        filters: undefined,
        force: false,
      });
    });

    it("should include mirrorReport when versions are synced", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const mockMirrorReport: MirrorReport = {
        timestamp: new Date().toISOString(),
        versions: new Map([
          [
            "16.0.0",
            {
              version: "16.0.0",
              counts: { downloaded: 3, skipped: 0, failed: 0 },
              files: {
                downloaded: [],
                skipped: [],
                failed: [],
              },
              metrics: {
                cacheHitRate: 0,
                failureRate: 0,
                successRate: 100,
              },
              errors: [],
            },
          ],
        ]),
      };

      vi.mocked(mirror).mockResolvedValueOnce([mockMirrorReport, null]);

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await sync(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.mirrorReport).toBeDefined();
      expect(data?.mirrorReport).toEqual(mockMirrorReport);
    });
  });

  describe("cleanOrphaned option", () => {
    it("should remove orphaned files when cleanOrphaned is true", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const mockMirrorReport: MirrorReport = {
        timestamp: new Date().toISOString(),
        versions: new Map([
          [
            "16.0.0",
            {
              version: "16.0.0",
              counts: { downloaded: 0, skipped: 0, failed: 0 },
              files: {
                downloaded: [],
                skipped: [],
                failed: [],
              },
              metrics: {
                cacheHitRate: 0,
                failureRate: 0,
                successRate: 100,
              },
              errors: [],
            },
          ],
        ]),
      };

      vi.mocked(mirror).mockResolvedValueOnce([mockMirrorReport, null]);

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "data",
          "/test/16.0.0/OrphanedFile.txt": "orphaned",
        },
      });

      // Create snapshot with expected files
      await writeSnapshot(fs, context.basePath, "16.0.0", {
        unicodeVersion: "16.0.0",
        files: {
          "UnicodeData.txt": { hash: "sha256:test", size: 4 },
        },
      });

      const [data, error] = await sync(context, {
        cleanOrphaned: true,
      });

      expect(error).toBeNull();
      expect(data?.removedFiles.get("16.0.0")).toContain("OrphanedFile.txt");
      const exists = await fs.exists("/test/16.0.0/OrphanedFile.txt");
      expect(exists).toBe(false);
    });

    it("should keep orphaned files when cleanOrphaned is false", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const mockMirrorReport: MirrorReport = {
        timestamp: new Date().toISOString(),
        versions: new Map([
          [
            "16.0.0",
            {
              version: "16.0.0",
              counts: { downloaded: 0, skipped: 0, failed: 0 },
              files: {
                downloaded: [],
                skipped: [],
                failed: [],
              },
              metrics: {
                cacheHitRate: 0,
                failureRate: 0,
                successRate: 100,
              },
              errors: [],
            },
          ],
        ]),
      };

      vi.mocked(mirror).mockResolvedValueOnce([mockMirrorReport, null]);

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/OrphanedFile.txt": "orphaned",
        },
      });

      const [data, error] = await sync(context, {
        cleanOrphaned: false,
      });

      expect(error).toBeNull();
      expect(data?.removedFiles.size).toBe(0);
      const exists = await fs.exists("/test/16.0.0/OrphanedFile.txt");
      expect(exists).toBe(true);
    });
  });

  describe("versions option", () => {
    it("should sync only specified versions", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
      });

      const mockMirrorReport: MirrorReport = {
        timestamp: new Date().toISOString(),
        versions: new Map([
          [
            "16.0.0",
            {
              version: "16.0.0",
              counts: { downloaded: 0, skipped: 0, failed: 0 },
              files: {
                downloaded: [],
                skipped: [],
                failed: [],
              },
              metrics: {
                cacheHitRate: 0,
                failureRate: 0,
                successRate: 100,
              },
              errors: [],
            },
          ],
        ]),
      };

      vi.mocked(mirror).mockResolvedValueOnce([mockMirrorReport, null]);

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
        lockfile: createEmptyLockfile(["16.0.0", "15.1.0", "15.0.0"]),
      });

      const [_data, error] = await sync(context, {
        versions: ["16.0.0"],
      });

      expect(error).toBeNull();
      expect(mirror).toHaveBeenCalledWith(context, expect.objectContaining({
        versions: ["16.0.0"],
      }));
    });

    it("should throw error when specified version does not exist in lockfile", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [_data, error] = await sync(context, {
        versions: ["99.0.0"],
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain("does not exist");
    });
  });

  describe("error handling", () => {
    it("should handle API config fetch failure", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-config.json": {
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

      const [_data, error] = await sync(context);

      expect(error).toBeDefined();
      expect(error?.message).toContain("Failed to fetch versions");
    });

    it("should propagate mirror operation failure", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const mockError = new Error("Mirror failed");
      vi.mocked(mirror).mockResolvedValueOnce([null, mockError as any]);

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [_data, error] = await sync(context);

      expect(error).toBeDefined();
      expect(error?.message).toBe("Mirror failed");
    });
  });

  describe("filter application", () => {
    it("should apply filters during sync", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const mockMirrorReport: MirrorReport = {
        timestamp: new Date().toISOString(),
        versions: new Map([
          [
            "16.0.0",
            {
              version: "16.0.0",
              counts: { downloaded: 0, skipped: 0, failed: 0 },
              files: {
                downloaded: [],
                skipped: [],
                failed: [],
              },
              metrics: {
                cacheHitRate: 0,
                failureRate: 0,
                successRate: 100,
              },
              errors: [],
            },
          ],
        ]),
      };

      vi.mocked(mirror).mockResolvedValueOnce([mockMirrorReport, null]);

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [_data, error] = await sync(context, {
        filters: { include: ["**/*.txt"] },
      });

      expect(error).toBeNull();
      expect(mirror).toHaveBeenCalledWith(context, expect.objectContaining({
        filters: { include: ["**/*.txt"] },
      }));
    });
  });

  describe("edge cases", () => {
    it("should handle empty versions array", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await sync(context, {
        versions: [],
      });

      expect(error).toBeNull();
      expect(data?.added).toEqual([]);
      expect(data?.removed).toEqual([]);
      expect(data?.unchanged).toEqual([]);
      expect(data?.versions).toEqual([]);
    });

    it("should handle no lockfile exists initially", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await sync(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.added).toEqual(["16.0.0"]);
    });

    it("should return proper result structure when no changes", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const mockMirrorReport: MirrorReport = {
        timestamp: new Date().toISOString(),
        versions: new Map([
          [
            "16.0.0",
            {
              version: "16.0.0",
              counts: { downloaded: 0, skipped: 0, failed: 0 },
              files: {
                downloaded: [],
                skipped: [],
                failed: [],
              },
              metrics: {
                cacheHitRate: 0,
                failureRate: 0,
                successRate: 100,
              },
              errors: [],
            },
          ],
        ]),
      };

      vi.mocked(mirror).mockResolvedValueOnce([mockMirrorReport, null]);

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await sync(context);

      expect(error).toBeNull();
      expect(data).toMatchObject({
        timestamp: expect.any(String),
        added: [],
        removed: [],
        unchanged: ["16.0.0"],
        versions: ["16.0.0"],
        removedFiles: expect.any(Map),
      });
      expect(data?.mirrorReport).toBeDefined();
      expect(data?.mirrorReport).toEqual(mockMirrorReport);
    });
  });
});
