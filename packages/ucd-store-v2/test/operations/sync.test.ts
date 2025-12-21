import type { MirrorReport } from "../../src/operations/mirror";
import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { createEmptyLockfile } from "@ucdjs/lockfile/test-utils";
import { mockStoreApi } from "#test-utils/mock-store";
import { describe, expect, it, vi } from "vitest";
import { readLockfile } from "@ucdjs/lockfile";
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
    it("should use versions from ucd-config.json when available", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
        responses: {
          "/.well-known/ucd-config.json": {
            version: "0.1",
            endpoints: {
              files: "/api/v1/files",
              manifest: "/.well-known/ucd-store.json",
              versions: "/api/v1/versions",
            },
            versions: ["16.0.0", "15.1.0", "15.0.0"],
          },
        },
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act
      const [data, error] = await sync(context);

      // Assert
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.added).toEqual(["15.1.0", "15.0.0"]);

      // Verify lockfile was updated
      const lockfile = await readLockfile(fs, lockfilePath);
      expect(Object.keys(lockfile.versions).sort()).toEqual(["15.0.0", "15.1.0", "16.0.0"]);
      expect(lockfile.versions["15.1.0"]).toEqual({
        path: "v15.1.0/snapshot.json",
        fileCount: 0,
        totalSize: 0,
      });
      expect(lockfile.versions["15.0.0"]).toEqual({
        path: "v15.0.0/snapshot.json",
        fileCount: 0,
        totalSize: 0,
      });
    });

    it("should fallback to versions.list() when config doesn't have versions", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
        responses: {
          "/.well-known/ucd-config.json": {
            version: "0.1",
            endpoints: {
              files: "/api/v1/files",
              manifest: "/.well-known/ucd-store.json",
              versions: "/api/v1/versions",
            },
            // No versions array
          },
        },
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act
      const [data, error] = await sync(context);

      // Assert
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.added).toEqual(["15.1.0", "15.0.0"]);

      // Verify lockfile was updated
      const lockfile = await readLockfile(fs, lockfilePath);
      expect(Object.keys(lockfile.versions).sort()).toEqual(["15.0.0", "15.1.0", "16.0.0"]);
      expect(lockfile.versions["15.1.0"]).toEqual({
        path: "v15.1.0/snapshot.json",
        fileCount: 0,
        totalSize: 0,
      });
      expect(lockfile.versions["15.0.0"]).toEqual({
        path: "v15.0.0/snapshot.json",
        fileCount: 0,
        totalSize: 0,
      });
    });
  });

  describe("add strategy", () => {
    it("should sync with default add strategy", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act
      const [data, error] = await sync(context);

      // Assert
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
      expect(Object.keys(lockfile.versions).sort()).toEqual(["15.0.0", "15.1.0", "16.0.0"]);
      expect(lockfile.versions["16.0.0"]?.path).toBe("v16.0.0/snapshot.json");
      expect(lockfile.versions["15.1.0"]?.path).toBe("v15.1.0/snapshot.json");
      expect(lockfile.versions["15.0.0"]?.path).toBe("v15.0.0/snapshot.json");
    });

    it("should keep versions not in API when using add strategy", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "14.0.0"], // 14.0.0 not in API
        lockfile: createEmptyLockfile(["16.0.0", "14.0.0"]),
      });

      // Act
      const [data, error] = await sync(context, {
        strategy: "add",
      });

      // Assert
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toMatchObject({
        timestamp: expect.any(String),
        added: ["15.1.0"],
        removed: [], // add strategy doesn't remove
        unchanged: ["16.0.0", "14.0.0"],
        versions: expect.arrayContaining(["16.0.0", "15.1.0", "14.0.0"]),
      });
      expect(data?.versions).toHaveLength(3);

      const lockfile = await readLockfile(fs, lockfilePath);
      expect(Object.keys(lockfile.versions).sort()).toEqual(["14.0.0", "15.1.0", "16.0.0"]);
    });
  });

  describe("update strategy", () => {
    it("should remove versions not in API when using update strategy", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "15.0.0"], // 15.0.0 not in API
        lockfile: createEmptyLockfile(["16.0.0", "15.0.0"]),
      });

      // Act
      const [data, error] = await sync(context, {
        strategy: "update",
      });

      // Assert
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toMatchObject({
        timestamp: expect.any(String),
        added: ["15.1.0"],
        removed: ["15.0.0"], // update strategy removes unavailable versions
        unchanged: ["16.0.0"],
        versions: expect.arrayContaining(["16.0.0", "15.1.0"]),
      });
      expect(data?.versions).toHaveLength(2);
      expect(data?.versions).not.toContain("15.0.0");

      const lockfile = await readLockfile(fs, lockfilePath);
      expect(Object.keys(lockfile.versions).sort()).toEqual(["15.1.0", "16.0.0"]);
      expect(lockfile.versions).not.toHaveProperty("15.0.0");
    });
  });

  describe("lockfile updates", () => {
    it("should preserve existing lockfile entries when updating", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: {
          lockfileVersion: 1,
          versions: {
            "16.0.0": {
              path: "v16.0.0/snapshot.json",
              fileCount: 10,
              totalSize: 1024,
            },
          },
        },
      });

      // Act
      const [_data, error] = await sync(context);

      // Assert
      expect(error).toBeNull();
      const lockfile = await readLockfile(fs, lockfilePath);
      // Existing entry should be preserved
      expect(lockfile.versions["16.0.0"]).toEqual({
        path: "v16.0.0/snapshot.json",
        fileCount: 10,
        totalSize: 1024,
      });
      // New entry should have empty snapshot
      expect(lockfile.versions["15.1.0"]).toEqual({
        path: "v15.1.0/snapshot.json",
        fileCount: 0,
        totalSize: 0,
      });
    });
  });

  describe("with mirror", () => {
    it("should support mirror option and mirror new versions", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Mock the mirror function to return a successful mirror result
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

      // Act
      const [data, error] = await sync(context, {
        mirror: true,
      });

      // Assert
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.added).toEqual(["15.1.0"]);
      expect(data?.mirrored).toBeDefined();
      expect(data?.mirrored).toEqual(mockMirrorReport);
      expect(mirror).toHaveBeenCalledWith(context, { versions: ["15.1.0"] });
    });

    it("should not include mirrored property when mirror:true but no new versions", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act
      const [data, error] = await sync(context, {
        mirror: true,
      });

      // Assert
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.mirrored).toBeUndefined();
    });
  });

  describe("no changes", () => {
    it("should return proper result structure when no changes", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act
      const [data, error] = await sync(context);

      // Assert
      expect(error).toBeNull();
      expect(data).toEqual({
        timestamp: expect.any(String),
        added: [],
        removed: [],
        unchanged: ["16.0.0"],
        versions: ["16.0.0"],
      });
    });
  });
});
