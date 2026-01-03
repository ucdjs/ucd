import { describe, expect, it } from "vitest";
import {
  createEmptyLockfile,
  createLockfile,
  createLockfileEntry,
} from "../src/test-utils/lockfile-builder";

describe("lockfile-builder", () => {
  describe("createLockfileEntry", () => {
    it("should create a basic entry with defaults", () => {
      const entry = createLockfileEntry("16.0.0");

      expect(entry.path).toBe("16.0.0/snapshot.json");
      expect(entry.fileCount).toBe(0);
      expect(entry.totalSize).toBe(0);
      expect(entry.createdAt).toBeInstanceOf(Date);
      expect(entry.updatedAt).toBeInstanceOf(Date);
    });

    it("should accept custom values", () => {
      const customDate = new Date("2024-01-01T00:00:00.000Z");
      const entry = createLockfileEntry("15.1.0", {
        fileCount: 100,
        totalSize: 50000,
        snapshotPath: "custom/path/snapshot.json",
        createdAt: customDate,
        updatedAt: customDate,
      });

      expect(entry.path).toBe("custom/path/snapshot.json");
      expect(entry.fileCount).toBe(100);
      expect(entry.totalSize).toBe(50000);
      expect(entry.createdAt).toEqual(customDate);
      expect(entry.updatedAt).toEqual(customDate);
    });
  });

  describe("createEmptyLockfile", () => {
    it("should create an empty lockfile with no versions", () => {
      const lockfile = createEmptyLockfile([]);

      expect(lockfile.lockfileVersion).toBe(1);
      expect(lockfile.createdAt).toBeInstanceOf(Date);
      expect(lockfile.updatedAt).toBeInstanceOf(Date);
      expect(Object.keys(lockfile.versions)).toHaveLength(0);
      expect(lockfile.filters).toBeUndefined();
    });

    it("should create a lockfile with specified versions", () => {
      const lockfile = createEmptyLockfile(["16.0.0", "15.1.0"]);

      expect(Object.keys(lockfile.versions)).toHaveLength(2);
      expect(lockfile.versions["16.0.0"]).toBeDefined();
      expect(lockfile.versions["15.1.0"]).toBeDefined();
      expect(lockfile.versions["16.0.0"]?.fileCount).toBe(0);
      expect(lockfile.versions["16.0.0"]?.totalSize).toBe(0);
    });

    it("should use consistent timestamps for all entries", () => {
      const lockfile = createEmptyLockfile(["16.0.0", "15.1.0"]);

      // All timestamps should be the same (created at the same time)
      expect(lockfile.createdAt.getTime()).toBe(lockfile.updatedAt.getTime());
      expect(lockfile.versions["16.0.0"]?.createdAt.getTime()).toBe(lockfile.createdAt.getTime());
      expect(lockfile.versions["15.1.0"]?.createdAt.getTime()).toBe(lockfile.createdAt.getTime());
    });
  });

  describe("createLockfile", () => {
    it("should create a lockfile with custom file counts", () => {
      const lockfile = createLockfile(["16.0.0", "15.1.0"], {
        fileCounts: {
          "16.0.0": 150,
          "15.1.0": 140,
        },
      });

      expect(lockfile.versions["16.0.0"]?.fileCount).toBe(150);
      expect(lockfile.versions["15.1.0"]?.fileCount).toBe(140);
    });

    it("should create a lockfile with custom total sizes", () => {
      const lockfile = createLockfile(["16.0.0"], {
        totalSizes: {
          "16.0.0": 1000000,
        },
      });

      expect(lockfile.versions["16.0.0"]?.totalSize).toBe(1000000);
    });

    it("should create a lockfile with custom snapshot paths", () => {
      const lockfile = createLockfile(["16.0.0"], {
        snapshotPaths: {
          "16.0.0": "custom/16.0.0/snap.json",
        },
      });

      expect(lockfile.versions["16.0.0"]?.path).toBe("custom/16.0.0/snap.json");
    });

    it("should create a lockfile with filters", () => {
      const lockfile = createLockfile(["16.0.0"], {
        filters: {
          include: ["*.txt", "*.html"],
          exclude: ["*.zip", "*.pdf"],
          disableDefaultExclusions: true,
        },
      });

      expect(lockfile.filters).toBeDefined();
      expect(lockfile.filters?.include).toEqual(["*.txt", "*.html"]);
      expect(lockfile.filters?.exclude).toEqual(["*.zip", "*.pdf"]);
      expect(lockfile.filters?.disableDefaultExclusions).toBe(true);
    });

    it("should not include filters if not provided", () => {
      const lockfile = createLockfile(["16.0.0"]);

      expect(lockfile.filters).toBeUndefined();
    });

    it("should create a lockfile with custom timestamps", () => {
      const created = new Date("2024-01-01T00:00:00.000Z");
      const updated = new Date("2024-06-01T00:00:00.000Z");

      const lockfile = createLockfile(["16.0.0"], {
        createdAt: created,
        updatedAt: updated,
      });

      expect(lockfile.createdAt).toEqual(created);
      expect(lockfile.updatedAt).toEqual(updated);
    });

    it("should create a lockfile with per-version timestamps", () => {
      const lockfileCreated = new Date("2024-01-01T00:00:00.000Z");
      const version16Created = new Date("2024-02-01T00:00:00.000Z");
      const version15Created = new Date("2024-03-01T00:00:00.000Z");

      const lockfile = createLockfile(["16.0.0", "15.1.0"], {
        createdAt: lockfileCreated,
        updatedAt: lockfileCreated,
        versionTimestamps: {
          "16.0.0": {
            createdAt: version16Created,
            updatedAt: version16Created,
          },
          "15.1.0": {
            createdAt: version15Created,
            updatedAt: version15Created,
          },
        },
      });

      expect(lockfile.createdAt).toEqual(lockfileCreated);
      expect(lockfile.versions["16.0.0"]?.createdAt).toEqual(version16Created);
      expect(lockfile.versions["15.1.0"]?.createdAt).toEqual(version15Created);
    });

    it("should default version timestamps to lockfile timestamps", () => {
      const created = new Date("2024-01-01T00:00:00.000Z");

      const lockfile = createLockfile(["16.0.0"], {
        createdAt: created,
        updatedAt: created,
      });

      expect(lockfile.versions["16.0.0"]?.createdAt).toEqual(created);
      expect(lockfile.versions["16.0.0"]?.updatedAt).toEqual(created);
    });
  });
});
