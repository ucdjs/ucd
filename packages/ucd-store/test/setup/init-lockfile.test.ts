import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { readLockfile } from "@ucdjs/lockfile";
import { describe, expect, it } from "vitest";
import { UCDStoreGenericError } from "../../src/errors";
import { initLockfile } from "../../src/setup/init-lockfile";

describe("initLockfile", () => {
  describe("lockfile creation", () => {
    it("should create lockfile with valid versions", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
        responses: {
          "/api/v1/versions": true,
        },
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
      });

      // Act
      await initLockfile(context);

      // Assert
      const lockfile = await readLockfile(fs, lockfilePath);
      expect(Object.keys(lockfile.versions).sort()).toEqual(["15.1.0", "16.0.0"]);
      expect(lockfile.versions["16.0.0"]).toEqual(expect.objectContaining({
        path: "16.0.0/snapshot.json",
        fileCount: 0,
        totalSize: 0,
      }));
      expect(lockfile.versions["15.1.0"]).toEqual(expect.objectContaining({
        path: "15.1.0/snapshot.json",
        fileCount: 0,
        totalSize: 0,
      }));
    });

    it("should create lockfile with correct snapshot paths", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
        responses: {
          "/api/v1/versions": true,
        },
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
      });

      // Act
      await initLockfile(context);

      // Assert
      const lockfile = await readLockfile(fs, lockfilePath);
      for (const version of context.versions.resolved) {
        expect(lockfile.versions[version]?.path).toBe(`${version}/snapshot.json`);
        expect(lockfile.versions[version]?.fileCount).toBe(0);
        expect(lockfile.versions[version]?.totalSize).toBe(0);
      }
    });

    it("should create empty lockfile when versions array is empty", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/api/v1/versions": true,
        },
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: [],
      });

      // Act
      await initLockfile(context);

      // Assert
      const lockfile = await readLockfile(fs, lockfilePath);
      expect(lockfile.versions).toEqual({});
    });
  });

  describe("directory creation", () => {
    it("should create base directory when it doesn't exist", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/api/v1/versions": true,
        },
      });

      const { context, fs } = await createTestContext({
        basePath: "/test/nested/path",
        versions: ["16.0.0"],
      });

      await initLockfile(context);

      // basePath is now handled by fs-bridge, test directory existence via fs
      const exists = await fs.exists(".");
      expect(exists).toBe(true);
    });

    it("should not create directory when base path already exists", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/api/v1/versions": true,
        },
      });

      const { context, fs, lockfilePath } = await createTestContext({
        basePath: "/test",
        versions: ["16.0.0"],
        initialFiles: {
          "/test/.exists": "marker",
        },
      });

      // Act
      await expect(initLockfile(context)).resolves.not.toThrow();

      // Assert
      const lockfile = await readLockfile(fs, lockfilePath);
      expect(Object.keys(lockfile.versions)).toEqual(["16.0.0"]);
    });
  });

  describe("version validation", () => {
    it("should validate versions against API", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/api/v1/versions": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      // Act & Assert
      await expect(initLockfile(context)).resolves.not.toThrow();
    });

    it("should throw UCDStoreGenericError when versions not available", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/api/v1/versions": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "99.0.0", "88.0.0"],
      });

      // Act & Assert
      await expect(initLockfile(context)).rejects.toThrow(UCDStoreGenericError);
    });

    it("should include unavailable versions in error message", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/api/v1/versions": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "99.0.0", "88.0.0"],
      });

      // Act
      const error = await initLockfile(context).catch((e) => e);

      // Assert
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error.message).toContain("Some requested versions are not available in the API: 99.0.0, 88.0.0");
    });
  });

  describe("error handling", () => {
    it("should throw UCDStoreGenericError when API request fails", async () => {
      // Arrange
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      // Act & Assert
      await expect(initLockfile(context)).rejects.toThrow(UCDStoreGenericError);
    });

    it("should include 'Failed to fetch Unicode versions' in error message", async () => {
      // Arrange
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      // Act
      const error = await initLockfile(context).catch((e) => e);

      // Assert
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error.message).toContain("Failed to fetch Unicode versions");
    });

    it("should throw UCDStoreGenericError when API returns no data", async () => {
      // Arrange
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(null);
        }],
      ]);

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      // Act & Assert
      await expect(initLockfile(context)).rejects.toThrow(UCDStoreGenericError);
    });

    it("should include 'no versions available' in error message", async () => {
      // Arrange
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(null);
        }],
      ]);

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      // Act
      const error = await initLockfile(context).catch((e) => e);

      // Assert
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error.message).toContain("Failed to fetch Unicode versions: no versions available from API");
    });

    it("should throw error when filesystem lacks mkdir capability", async () => {
      // Arrange
      const noMkdirFS = defineFileSystemBridge({
        meta: {
          name: "No-Mkdir Bridge",
          description: "Bridge without mkdir capability",
        },
        setup() {
          return {
            async read() {
              return "";
            },
            async exists() {
              return false;
            },
            async listdir() {
              return [];
            },
            async write() {},
          };
        },
      })();

      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        fs: noMkdirFS,
      });

      // Act & Assert
      await expect(initLockfile(context)).rejects.toThrow("File system bridge does not support the 'mkdir' capability.");
    });

    it("should skip lockfile write when bridge does not support writing", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "/test/.exists": "marker", // ensure basePath exists so mkdir is not needed
        },
      });

      // Simulate a read-only context (lockfile not supported)
      context.lockfile.supports = false;

      // Act - should not throw even though lockfile can't be written
      await expect(initLockfile(context)).resolves.not.toThrow();
    });
  });
});
