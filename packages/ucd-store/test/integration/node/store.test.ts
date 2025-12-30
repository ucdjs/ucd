import { mockStoreApi } from "#test-utils/mock-store";
import nodeFileSystemBridge from "@ucdjs/fs-bridge/bridges/node";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { createUCDStore } from "../../../src/store";

describe("node integration: store creation", () => {
  describe("bootstrap behavior", () => {
    it.only("should create store with node bridge and bootstrap lockfile", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/api/v1/versions": true,
          "/api/v1/files/{wildcard}": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/.well-known/ucd-store/{version}.json": true,
          "/.well-known/ucd-config.json": true,
        },
        onRequest: ({ params, path }) => {
          console.error("API called: ", path, params);
        },
      });

      const storePath = await testdir({}, {
        cleanup: false,
      });

      const store = await createUCDStore({
        basePath: storePath,
        fs: nodeFileSystemBridge,
        fsOptions: {
          basePath: storePath,
        },
        versions: ["16.0.0"],
      });

      expect(store).toBeDefined();
      expect(store.versions).toEqual(["16.0.0"]);
    });

    it("should create lockfile on disk when bootstrapping", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/api/v1/versions": true,
        },
      });

      const storePath = await testdir({});

      const store = await createUCDStore({
        basePath: storePath,
        fs: nodeFileSystemBridge,
        versions: ["16.0.0", "15.1.0"],
        bootstrap: true,
        verify: false,
      });

      expect(store.versions).toEqual(["16.0.0", "15.1.0"]);

      // Verify lockfile was created on disk
      const fs = await import("node:fs/promises");
      const lockfilePath = `${storePath}/ucd.lock`;
      const lockfileExists = await fs.stat(lockfilePath).then(() => true).catch(() => false);
      expect(lockfileExists).toBe(true);

      // Verify lockfile content
      const lockfileContent = await fs.readFile(lockfilePath, "utf-8");
      const lockfile = JSON.parse(lockfileContent);
      expect(lockfile.versions).toHaveProperty("16.0.0");
      expect(lockfile.versions).toHaveProperty("15.1.0");
    });

    it("should skip bootstrap when bootstrap: false", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
        },
      });

      const storePath = await testdir({});

      // Without bootstrap and without existing lockfile, should use versions from options
      const store = await createUCDStore({
        basePath: storePath,
        fs: nodeFileSystemBridge,
        versions: ["16.0.0"],
        bootstrap: false,
        verify: false,
      });

      expect(store).toBeDefined();
      // Store should still work but no lockfile created
      const fs = await import("node:fs/promises");
      const lockfileExists = await fs.stat(`${storePath}/ucd.lock`).then(() => true).catch(() => false);
      expect(lockfileExists).toBe(false);
    });
  });

  describe("existing lockfile", () => {
    it("should read versions from existing lockfile", async () => {
      const lockfile = {
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: {
          "16.0.0": {
            path: "16.0.0/snapshot.json",
            fileCount: 0,
            totalSize: 0,
          },
          "15.1.0": {
            path: "15.1.0/snapshot.json",
            fileCount: 0,
            totalSize: 0,
          },
        },
      };

      const storePath = await testdir({
        "ucd.lock": JSON.stringify(lockfile, null, 2),
      });

      const store = await createUCDStore({
        basePath: storePath,
        fs: nodeFileSystemBridge,
        versions: [], // No versions specified, should use lockfile
        bootstrap: false,
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
        },
      });

      const storePath = await testdir({});

      const store = await createUCDStore({
        basePath: storePath,
        fs: nodeFileSystemBridge,
        versions: ["16.0.0"],
        bootstrap: true,
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
      expect(store.compare).toBeTypeOf("function");
    });
  });
});
