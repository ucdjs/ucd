import { mockStoreApi } from "#test-utils/mock-store";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { createNodeUCDStore } from "../../../src/factory";

describe("node integration: store creation", () => {
  describe("lockfile initialization", () => {
    it("should create store with node bridge and initialize lockfile", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/api/v1/versions": true,
          "/api/v1/files/{wildcard}": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/.well-known/ucd-store/{version}.json": true,
          "/.well-known/ucd-config.json": true,
        },
      });

      const storePath = await testdir({});

      const store = await createNodeUCDStore({
        basePath: storePath,
        versions: ["16.0.0"],
        requireExistingStore: false,
        verify: false,
      });

      expect(store).toBeDefined();
      expect(store.versions).toEqual(["16.0.0"]);
    });

    it("should create lockfile on disk when initializing", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/api/v1/versions": true,
          "/.well-known/ucd-config.json": true,
        },
      });

      const storePath = await testdir({});

      const store = await createNodeUCDStore({
        basePath: storePath,
        versions: ["16.0.0", "15.1.0"],
        requireExistingStore: false,
        verify: false,
      });

      expect(store.versions).toEqual(["16.0.0", "15.1.0"]);

      // Verify lockfile was created on disk
      const fs = await import("node:fs/promises");
      const lockfilePath = `${storePath}/.ucd-store.lock`;
      const lockfileExists = await fs.stat(lockfilePath).then(() => true).catch(() => false);
      expect(lockfileExists).toBe(true);

      // Verify lockfile content
      const lockfileContent = await fs.readFile(lockfilePath, "utf-8");
      const lockfile = JSON.parse(lockfileContent);
      expect(lockfile.versions).toHaveProperty("16.0.0");
      expect(lockfile.versions).toHaveProperty("15.1.0");
    });

    it("should throw error when requireExistingStore: true and no lockfile exists", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
          "/.well-known/ucd-config.json": true,
        },
      });

      const storePath = await testdir({});

      // With requireExistingStore: true (default) and without existing lockfile, should throw
      await expect(createNodeUCDStore({
        basePath: storePath,
        versions: ["16.0.0"],
        requireExistingStore: true,
        verify: false,
      })).rejects.toThrow("lockfile not found");
    });
  });

  describe("existing lockfile", () => {
    it("should read versions from existing lockfile", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/.well-known/ucd-config.json": true,
        },
      });

      const now = new Date().toISOString();
      const lockfile = {
        lockfileVersion: 1,
        createdAt: now,
        updatedAt: now,
        versions: {
          "16.0.0": {
            path: "16.0.0/snapshot.json",
            fileCount: 0,
            totalSize: 0,
            createdAt: now,
            updatedAt: now,
          },
          "15.1.0": {
            path: "15.1.0/snapshot.json",
            fileCount: 0,
            totalSize: 0,
            createdAt: now,
            updatedAt: now,
          },
        },
      };

      const storePath = await testdir({
        ".ucd-store.lock": JSON.stringify(lockfile, null, 2),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
        versions: [], // No versions specified, should use lockfile
        requireExistingStore: true,
        verify: false,
      });

      expect([...store.versions].sort()).toEqual(["15.1.0", "16.0.0"]);
    });
  });

  describe("store operations availability", () => {
    it("should expose all store operations", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
          "/.well-known/ucd-config.json": true,
        },
      });

      const storePath = await testdir({});

      const store = await createNodeUCDStore({
        basePath: storePath,
        versions: ["16.0.0"],
        requireExistingStore: false,
        verify: false,
      });

      // Check file operations namespace
      expect(store.files).toBeDefined();
      expect(store.files.get).toBeTypeOf("function");
      expect(store.files.list).toBeTypeOf("function");
      expect(store.files.tree).toBeTypeOf("function");

      // Check top-level operations
      expect(store.mirror).toBeTypeOf("function");
      expect(store.sync).toBeTypeOf("function");
      expect(store.analyze).toBeTypeOf("function");
    });
  });
});
