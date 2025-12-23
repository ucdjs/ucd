import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { readLockfile, readSnapshot } from "@ucdjs/lockfile";
import { createEmptyLockfile } from "@ucdjs/lockfile/test-utils";
import { describe, expect, it } from "vitest";
import { mirror } from "../../src/operations/mirror";
import { sync } from "../../src/operations/sync";
import { bootstrap } from "../../src/setup/bootstrap";
import { verify } from "../../src/setup/verify";
import { createUCDStore } from "../../src/store";

describe("store operations integration", () => {
  describe("bootstrap → Mirror → Verify flow", () => {
    it("should complete full workflow: bootstrap creates lockfile, mirror creates snapshots, verify checks integrity", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            expectedFiles: [
              "UnicodeData.txt",
              "Blocks.txt",
            ],
          },
          "/api/v1/files/{wildcard}": ({ params }) => {
            return HttpResponse.text(`Content of ${params.wildcard}`);
          },
        },
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
      });

      // Act - Step 1: Bootstrap
      await bootstrap({
        client: context.client,
        fs: context.fs,
        basePath: context.basePath,
        versions: context.versions,
        lockfilePath: context.lockfilePath,
      });

      // Verify bootstrap created lockfile
      const lockfileAfterBootstrap = await readLockfile(fs, lockfilePath);
      expect(Object.keys(lockfileAfterBootstrap.versions)).toEqual(["16.0.0"]);
      expect(lockfileAfterBootstrap.versions["16.0.0"]?.fileCount).toBe(0);
      expect(lockfileAfterBootstrap.versions["16.0.0"]?.totalSize).toBe(0);

      // Act - Step 2: Mirror
      const [mirrorData, mirrorError] = await mirror(context);
      expect(mirrorError).toBeNull();
      expect(mirrorData).toBeDefined();

      // Verify mirror created snapshot
      const snapshot = await readSnapshot(fs, context.basePath, "16.0.0");
      expect(snapshot.unicodeVersion).toBe("16.0.0");
      expect(Object.keys(snapshot.files).length).toBeGreaterThan(0);

      // Verify lockfile was updated with snapshot metadata
      const lockfileAfterMirror = await readLockfile(fs, lockfilePath);
      expect(lockfileAfterMirror.versions["16.0.0"]?.fileCount).toBeGreaterThan(0);
      expect(lockfileAfterMirror.versions["16.0.0"]?.totalSize).toBeGreaterThan(0);
      expect(lockfileAfterMirror.versions["16.0.0"]?.path).toBe("16.0.0/snapshot.json");

      // Act - Step 3: Verify
      const verifyResult = await verify({
        client: context.client,
        fs: context.fs,
        lockfilePath: context.lockfilePath,
        versions: ["16.0.0"],
      });

      expect(verifyResult.valid).toBe(true);
      expect(verifyResult.missingVersions).toEqual([]);
      // extraVersions shows versions available in API but not being tracked
      // Since we only bootstrap with 16.0.0 but API has 15.1.0 too, that's expected
      expect(verifyResult.extraVersions).toEqual(["15.1.0"]);
    });

    it("should handle multiple versions in bootstrap → mirror → verify flow", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            expectedFiles: [
              "UnicodeData.txt",
              "Blocks.txt",
            ],
          },
          "/api/v1/files/{wildcard}": ({ params }) => {
            return HttpResponse.text(`Content of ${params.wildcard}`);
          },
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
      });

      // Act - Bootstrap
      await bootstrap({
        client: context.client,
        fs: context.fs,
        basePath: context.basePath,
        versions: context.versions,
        lockfilePath: context.lockfilePath,
      });

      // Act - Mirror
      const [mirrorData, mirrorError] = await mirror(context);
      expect(mirrorError).toBeNull();
      expect(mirrorData).toBeDefined();

      // Verify both snapshots were created
      const snapshot16 = await readSnapshot(fs, context.basePath, "16.0.0");
      const snapshot15 = await readSnapshot(fs, context.basePath, "15.1.0");
      expect(snapshot16.unicodeVersion).toBe("16.0.0");
      expect(snapshot15.unicodeVersion).toBe("15.1.0");

      // Act - Verify
      const verifyResult = await verify({
        client: context.client,
        fs: context.fs,
        lockfilePath: context.lockfilePath,
        versions: ["16.0.0", "15.1.0"],
      });

      expect(verifyResult.valid).toBe(true);
    });
  });

  describe("sync operation", () => {
    it("should sync updates lockfile with new versions from API and mirrors files for all versions", async () => {
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
            versions: ["16.0.0", "15.1.0", "15.0.0"], // Config has new version
          },
          "/.well-known/ucd-store/{version}.json": {
            expectedFiles: [
              "UnicodeData.txt",
              "Blocks.txt",
            ],
          },
          "/api/v1/files/{wildcard}": ({ params }) => {
            return HttpResponse.text(`Content of ${params.wildcard}`);
          },
        },
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act - Sync (should add 15.1.0 and 15.0.0, and mirror files for all versions)
      const [syncData, syncError] = await sync(context);
      expect(syncError).toBeNull();
      expect(syncData).toBeDefined();
      expect(syncData?.added.sort()).toEqual(["15.0.0", "15.1.0"]);

      // Verify lockfile was updated
      const lockfileAfterSync = await readLockfile(fs, lockfilePath);
      const lockfileVersions = Object.keys(lockfileAfterSync.versions).sort();
      expect(lockfileVersions).toEqual(["15.0.0", "15.1.0", "16.0.0"]);

      // Verify snapshots were created for all versions (sync also mirrors files)
      const snapshot15_1 = await readSnapshot(fs, context.basePath, "15.1.0");
      const snapshot15_0 = await readSnapshot(fs, context.basePath, "15.0.0");
      const snapshot16 = await readSnapshot(fs, context.basePath, "16.0.0");
      expect(snapshot15_1.unicodeVersion).toBe("15.1.0");
      expect(snapshot15_0.unicodeVersion).toBe("15.0.0");
      expect(snapshot16.unicodeVersion).toBe("16.0.0");

      // Verify lockfile references correct snapshot paths (no "v" prefix)
      const lockfileAfterSync2 = await readLockfile(fs, lockfilePath);
      expect(lockfileAfterSync2.versions["15.1.0"]?.path).toBe("15.1.0/snapshot.json");
      expect(lockfileAfterSync2.versions["15.0.0"]?.path).toBe("15.0.0/snapshot.json");
      expect(lockfileAfterSync2.versions["16.0.0"]?.path).toBe("16.0.0/snapshot.json");
      expect(lockfileAfterSync2.versions["15.1.0"]?.fileCount).toBeGreaterThan(0);
      expect(lockfileAfterSync2.versions["15.0.0"]?.fileCount).toBeGreaterThan(0);
      expect(lockfileAfterSync2.versions["16.0.0"]?.fileCount).toBeGreaterThan(0);
    });

    it("should preserve existing lockfile entries when syncing and mirroring", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/.well-known/ucd-config.json": {
            version: "0.1",
            endpoints: {
              files: "/api/v1/files",
              manifest: "/.well-known/ucd-store.json",
              versions: "/api/v1/versions",
            },
            versions: ["16.0.0", "15.1.0"],
          },
          "/.well-known/ucd-store/{version}.json": {
            expectedFiles: [
              "UnicodeData.txt",
            ],
          },
          "/api/v1/files/{wildcard}": ({ params }) => {
            return HttpResponse.text(`Content of ${params.wildcard}`);
          },
        },
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: {
          lockfileVersion: 1,
          versions: {
            "16.0.0": {
              path: "16.0.0/snapshot.json",
              fileCount: 5,
              totalSize: 500,
            },
            "15.1.0": {
              path: "15.1.0/snapshot.json",
              fileCount: 0,
              totalSize: 0,
            },
          },
        },
      });

      // Act - Sync (should not change existing entries)
      const [, syncError] = await sync(context);
      expect(syncError).toBeNull();

      // Verify existing entry was preserved
      const lockfileAfterSync = await readLockfile(fs, lockfilePath);
      expect(lockfileAfterSync.versions["16.0.0"]?.fileCount).toBe(5);
      expect(lockfileAfterSync.versions["16.0.0"]?.totalSize).toBe(500);

      // Act - Mirror only 15.1.0
      const [, mirrorError] = await mirror(context, {
        versions: ["15.1.0"],
      });
      expect(mirrorError).toBeNull();

      // Verify 16.0.0 entry is still preserved
      const lockfileAfterMirror = await readLockfile(fs, lockfilePath);
      expect(lockfileAfterMirror.versions["16.0.0"]?.fileCount).toBe(5);
      expect(lockfileAfterMirror.versions["16.0.0"]?.totalSize).toBe(500);
      // And 15.1.0 was updated
      expect(lockfileAfterMirror.versions["15.1.0"]?.fileCount).toBeGreaterThan(0);
    });
  });

  describe("config-based version discovery", () => {
    it("should use versions from config when provided", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/.well-known/ucd-config.json": {
            version: "0.1",
            endpoints: {
              files: "/api/v1/files",
              manifest: "/.well-known/ucd-store.json",
              versions: "/api/v1/versions",
            },
            versions: ["16.0.0", "15.1.0"],
          },
        },
      });

      const { fs, basePath, lockfilePath } = await createTestContext({
        versions: [],
        lockfile: undefined,
      });

      const store = await createUCDStore({
        fs,
        basePath,
        versions: [], // Empty - should use config versions
        bootstrap: true,
      });

      expect(store).toBeDefined();

      // Verify lockfile was created with config versions
      const lockfile = await readLockfile(fs, lockfilePath);
      const lockfileVersions = Object.keys(lockfile.versions).sort();
      expect(lockfileVersions).toEqual(["15.1.0", "16.0.0"]);
    });

    it("should fallback to API when config unavailable", async () => {
      // Mock config endpoint to fail
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json({
            status: 500,
            message: "Internal Server Error",
            timestamp: new Date().toISOString(),
          }, { status: 500 });
        }],
      ]);

      mockStoreApi({
        versions: ["16.0.0"],
      });

      const { fs, basePath, lockfilePath } = await createTestContext({
        versions: [],
        lockfile: undefined,
      });

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"], // Provided version
        bootstrap: true,
      });

      expect(store).toBeDefined();

      // Verify lockfile was created with provided version
      const lockfile = await readLockfile(fs, lockfilePath);
      const lockfileVersions = Object.keys(lockfile.versions).sort();
      expect(lockfileVersions).toEqual(["16.0.0"]);
    });

    it("should use config versions for bootstrap when no versions provided", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/.well-known/ucd-config.json": {
            version: "0.1",
            endpoints: {
              files: "/api/v1/files",
              manifest: "/.well-known/ucd-store.json",
              versions: "/api/v1/versions",
            },
            versions: ["16.0.0", "15.1.0"],
          },
        },
      });

      const { fs, basePath, lockfilePath } = await createTestContext({
        versions: [],
        lockfile: undefined,
      });

      const store = await createUCDStore({
        fs,
        basePath,
        versions: [], // No versions provided
        bootstrap: true,
      });

      expect(store).toBeDefined();

      // Verify bootstrap used config versions
      const lockfile = await readLockfile(fs, lockfilePath);
      const lockfileVersions = Object.keys(lockfile.versions).sort();
      expect(lockfileVersions).toEqual(["15.1.0", "16.0.0"]);
    });
  });
});
