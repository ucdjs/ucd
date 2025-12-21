import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { readLockfile } from "@ucdjs/lockfile";
import { createUCDStore } from "../../src/store";

describe("config discovery integration", () => {
  describe("retrieveEndpointConfiguration fallback", () => {
    it("should use discovered config when available", async () => {
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

      const { fs, basePath } = await createTestContext({
        versions: [],
        lockfile: undefined,
      });

      const store = await createUCDStore({
        fs,
        basePath,
        versions: [],
        bootstrap: true,
      });

      expect(store).toBeDefined();
      expect(store.versions).toEqual(["16.0.0", "15.1.0"]);
    });

    it("should fallback to default config when discovery fails", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json({
            status: 500,
            message: "Internal Server Error",
            timestamp: new Date().toISOString(),
          }, { status: 500 });
        }],
      ]);

      // Mock versions endpoint for fallback
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { fs, basePath } = await createTestContext({
        versions: [],
        lockfile: undefined,
      });

      // Should not throw - should fallback to default config
      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        bootstrap: true,
      });

      expect(store).toBeDefined();
    });

    it("should handle network errors gracefully", async () => {
      // Mock config endpoint to throw network error
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          throw new Error("Network error");
        }],
      ]);

      // Mock versions endpoint for fallback
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const { fs, basePath } = await createTestContext({
        versions: [],
        lockfile: undefined,
      });

      // Should not throw - should fallback to default config
      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        bootstrap: true,
      });

      expect(store).toBeDefined();
    });
  });

  describe("version extraction from config", () => {
    it("should extract versions from ucd-config.json when available", async () => {
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
            versions: ["16.0.0", "15.1.0"], // Config has specific versions
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

      // Check that lockfile was created with versions from config
      const lockfile = await readLockfile(fs, lockfilePath);
      const lockfileVersions = Object.keys(lockfile.versions).sort();
      expect(lockfileVersions).toEqual(["15.1.0", "16.0.0"]);
    });

    it("should use provided versions when config doesn't have versions", async () => {
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
            // No versions field
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
        versions: ["16.0.0"], // Provided versions
        bootstrap: true,
      });

      expect(store).toBeDefined();

      // Check that lockfile was created with provided versions
      const lockfile = await readLockfile(fs, lockfilePath);
      const lockfileVersions = Object.keys(lockfile.versions).sort();
      expect(lockfileVersions).toEqual(["16.0.0"]);
    });

    it("should fallback to API versions.list() when config is unavailable", async () => {
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

      // Mock versions endpoint
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { fs, basePath, lockfilePath } = await createTestContext({
        versions: [],
        lockfile: undefined,
      });

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"], // Provided versions
        bootstrap: true,
      });

      expect(store).toBeDefined();

      // Check that lockfile was created with provided versions
      const lockfile = await readLockfile(fs, lockfilePath);
      const lockfileVersions = Object.keys(lockfile.versions).sort();
      expect(lockfileVersions).toEqual(["16.0.0"]);
    });
  });

  describe("store creation with config discovery", () => {
    it("should create store with discovered config", async () => {
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

      const { fs, basePath } = await createTestContext({
        versions: [],
        lockfile: undefined,
      });

      const store = await createUCDStore({
        fs,
        basePath,
        versions: [],
        bootstrap: true,
      });

      expect(store).toBeDefined();
      expect(store.files).toBeDefined();
      expect(store.mirror).toBeDefined();
      expect(store.sync).toBeDefined();
    });

    it("should create store with fallback to default config", async () => {
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

      const { fs, basePath } = await createTestContext({
        versions: [],
        lockfile: undefined,
      });

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        bootstrap: true,
      });

      expect(store).toBeDefined();
      expect(store.files).toBeDefined();
    });

    it("should use config versions for bootstrap when provided versions are empty", async () => {
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
        versions: [], // Empty versions - should use config versions
        bootstrap: true,
      });

      expect(store).toBeDefined();

      // Verify lockfile was created with config versions
      const lockfile = await readLockfile(fs, lockfilePath);
      const lockfileVersions = Object.keys(lockfile.versions).sort();
      expect(lockfileVersions).toEqual(["15.1.0", "16.0.0"]);
    });

    it("should prefer provided versions over config versions", async () => {
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
            versions: ["16.0.0", "15.1.0"], // Config has these versions
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
        versions: ["15.0.0"], // Provided version should be used
        bootstrap: true,
      });

      expect(store).toBeDefined();

      // Verify lockfile was created with provided version, not config versions
      const lockfile = await readLockfile(fs, lockfilePath);
      const lockfileVersions = Object.keys(lockfile.versions).sort();
      expect(lockfileVersions).toEqual(["15.0.0"]);
    });
  });
});
