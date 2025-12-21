import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { readLockfile } from "@ucdjs/lockfile";
import { describe, expect, it } from "vitest";
import { UCDStoreGenericError } from "../../src/errors";
import { bootstrap } from "../../src/setup/bootstrap";

function _createMockVersions(versions: string[]) {
  return versions.map((version) => ({
    version,
    documentationUrl: `https://www.unicode.org/versions/Unicode${version}/`,
    date: "2024",
    url: `https://www.unicode.org/Public/${version}`,
    mappedUcdVersion: null,
    type: "stable" as const,
  }));
}

describe("bootstrap", () => {
  describe("lockfile creation", () => {
    it("should create lockfile with valid versions", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
      });

      // Act
      await bootstrap({
        client: context.client,
        fs: context.fs,
        basePath: context.basePath,
        versions: context.versions,
        lockfilePath: context.lockfilePath,
      });

      // Assert
      const lockfile = await readLockfile(fs, lockfilePath);
      expect(Object.keys(lockfile.versions).sort()).toEqual(["15.1.0", "16.0.0"]);
      expect(lockfile.versions["16.0.0"]).toEqual({
        path: "v16.0.0/snapshot.json",
        fileCount: 0,
        totalSize: 0,
      });
      expect(lockfile.versions["15.1.0"]).toEqual({
        path: "v15.1.0/snapshot.json",
        fileCount: 0,
        totalSize: 0,
      });
    });

    it("should create lockfile with correct snapshot paths", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
      });

      // Act
      await bootstrap({
        client: context.client,
        fs: context.fs,
        basePath: context.basePath,
        versions: context.versions,
        lockfilePath: context.lockfilePath,
      });

      // Assert
      const lockfile = await readLockfile(fs, lockfilePath);
      for (const version of context.versions) {
        expect(lockfile.versions[version]?.path).toBe(`v${version}/snapshot.json`);
        expect(lockfile.versions[version]?.fileCount).toBe(0);
        expect(lockfile.versions[version]?.totalSize).toBe(0);
      }
    });

    it("should create empty lockfile when versions array is empty", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: [],
      });

      // Act
      await bootstrap({
        client: context.client,
        fs: context.fs,
        basePath: context.basePath,
        versions: context.versions,
        lockfilePath: context.lockfilePath,
      });

      // Assert
      const lockfile = await readLockfile(fs, lockfilePath);
      expect(lockfile.versions).toEqual({});
    });
  });

  describe("directory creation", () => {
    it("should create base directory when it doesn't exist", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context, fs } = await createTestContext({
        basePath: "/test/nested/path",
        versions: ["16.0.0"],
      });

      // Act
      await bootstrap({
        client: context.client,
        fs: context.fs,
        basePath: context.basePath,
        versions: context.versions,
        lockfilePath: context.lockfilePath,
      });

      // Assert
      const exists = await fs.exists(context.basePath);
      expect(exists).toBe(true);
    });

    it("should not create directory when base path already exists", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        basePath: "/test",
        versions: ["16.0.0"],
        initialFiles: {
          "/test/.exists": "marker",
        },
      });

      // Act
      await expect(
        bootstrap({
          client: context.client,
          fs: context.fs,
          basePath: context.basePath,
          versions: context.versions,
          lockfilePath: context.lockfilePath,
        }),
      ).resolves.not.toThrow();

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
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      // Act & Assert
      await expect(
        bootstrap({
          client: context.client,
          fs: context.fs,
          basePath: context.basePath,
          versions: context.versions,
          lockfilePath: context.lockfilePath,
        }),
      ).resolves.not.toThrow();
    });

    it("should throw error when requested versions are not available in API", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "99.0.0", "88.0.0"],
      });

      // Act & Assert
      await expect(
        bootstrap({
          client: context.client,
          fs: context.fs,
          basePath: context.basePath,
          versions: context.versions,
          lockfilePath: context.lockfilePath,
        }),
      ).rejects.toThrow(UCDStoreGenericError);

      await expect(
        bootstrap({
          client: context.client,
          fs: context.fs,
          basePath: context.basePath,
          versions: context.versions,
          lockfilePath: context.lockfilePath,
        }),
      ).rejects.toThrow("Some requested versions are not available in the API: 99.0.0, 88.0.0");
    });
  });

  describe("error handling", () => {
    it("should throw error when API request fails", async () => {
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
      await expect(
        bootstrap({
          client: context.client,
          fs: context.fs,
          basePath: context.basePath,
          versions: context.versions,
          lockfilePath: context.lockfilePath,
        }),
      ).rejects.toThrow(UCDStoreGenericError);

      await expect(
        bootstrap({
          client: context.client,
          fs: context.fs,
          basePath: context.basePath,
          versions: context.versions,
          lockfilePath: context.lockfilePath,
        }),
      ).rejects.toThrow("Failed to fetch Unicode versions");
    });

    it("should throw error when API returns no data", async () => {
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
      await expect(
        bootstrap({
          client: context.client,
          fs: context.fs,
          basePath: context.basePath,
          versions: context.versions,
          lockfilePath: context.lockfilePath,
        }),
      ).rejects.toThrow(UCDStoreGenericError);

      await expect(
        bootstrap({
          client: context.client,
          fs: context.fs,
          basePath: context.basePath,
          versions: context.versions,
          lockfilePath: context.lockfilePath,
        }),
      ).rejects.toThrow("Failed to fetch Unicode versions: no data returned");
    });

    it("should throw error when filesystem lacks mkdir capability", async () => {
      // Arrange
      const fs = defineFileSystemBridge({
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
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      // Act & Assert
      await expect(
        bootstrap({
          client: context.client,
          fs,
          basePath: context.basePath,
          versions: context.versions,
          lockfilePath: context.lockfilePath,
        }),
      ).rejects.toThrow("File system bridge does not support the 'mkdir' capability.");
    });
  });
});
