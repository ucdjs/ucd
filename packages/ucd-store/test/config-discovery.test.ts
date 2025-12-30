import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { getLockfilePath, readLockfile } from "@ucdjs/lockfile";
import { describe, expect, it } from "vitest";
import { createUCDStore } from "../src/store";

describe("config discovery integration", () => {
  it("should use versions from discovered config when no versions provided", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
      responses: {
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": true,
      },
    });

    const { fsFactory, basePath } = await createTestContext({
      versions: [],
      lockfile: undefined,
    });

    const store = await createUCDStore({
      fs: fsFactory,
      basePath,
      versions: [],
      bootstrap: true,
    });

    expect(store).toBeDefined();
    expect(store.versions).toEqual(["16.0.0", "15.1.0"]);
    expect(store.files).toBeDefined();
    expect(store.mirror).toBeDefined();
    expect(store.sync).toBeDefined();

    // Verify lockfile was created with config versions
    const lockfile = await readLockfile(store.fs, getLockfilePath(store.basePath));
    const lockfileVersions = Object.keys(lockfile.versions).sort();
    expect(lockfileVersions).toEqual(["15.1.0", "16.0.0"]);
  });

  it("should fallback to default config when discovery fails with 500", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
      responses: {
        "/api/v1/versions": true,
        "/.well-known/ucd-config.json": () => {
          return HttpResponse.json({
            status: 500,
            message: "Internal Server Error",
            timestamp: new Date().toISOString(),
          }, { status: 500 });
        },
      },
    });

    const { fsFactory, basePath } = await createTestContext({
      versions: [],
      lockfile: undefined,
    });

    const store = await createUCDStore({
      fs: fsFactory,
      basePath,
      versions: ["16.0.0"],
      bootstrap: true,
    });

    expect(store).toBeDefined();
    expect(store.versions).toEqual(["16.0.0"]);

    const lockfile = await readLockfile(store.fs, getLockfilePath(store.basePath));
    const lockfileVersions = Object.keys(lockfile.versions).sort();
    expect(lockfileVersions).toEqual(["16.0.0"]);
  });

  it("should fallback to default config when discovery fails with network error", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/versions": true,
        "/.well-known/ucd-config.json": () => {
          return HttpResponse.error();
        },
      },
    });

    const { fsFactory, basePath } = await createTestContext({
      versions: [],
      lockfile: undefined,
    });

    const store = await createUCDStore({
      fs: fsFactory,
      basePath,
      versions: ["16.0.0"],
      bootstrap: true,
    });

    expect(store).toBeDefined();
    expect(store.versions).toEqual(["16.0.0"]);

    const lockfile = await readLockfile(store.fs, getLockfilePath(store.basePath));
    const lockfileVersions = Object.keys(lockfile.versions).sort();
    expect(lockfileVersions).toEqual(["16.0.0"]);
  });

  it("should prefer provided versions over config versions", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0", "15.0.0"],
      responses: {
        "/.well-known/ucd-config.json": {
          version: "0.1",
          endpoints: {
            files: "/api/v1/files",
            manifest: "/.well-known/ucd-store/{version}.json",
            versions: "/api/v1/versions",
          },
          versions: ["16.0.0", "15.1.0"],
        },
        "/api/v1/versions": true,
      },
    });

    const { fs, fsFactory, basePath, lockfilePath } = await createTestContext({
      versions: [],
      lockfile: undefined,
    });

    const store = await createUCDStore({
      fs: fsFactory,
      basePath,
      versions: ["15.0.0"],
      bootstrap: true,
    });

    expect(store).toBeDefined();
    expect(store.versions).toEqual(["15.0.0"]);

    const lockfile = await readLockfile(fs, lockfilePath);
    const lockfileVersions = Object.keys(lockfile.versions).sort();
    expect(lockfileVersions).toEqual(["15.0.0"]);
  });

  it("should fail when provided versions are not available in API", async () => {
    mockStoreApi({
      versions: [],
      responses: {
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": true,
      },
    });

    const { fsFactory, basePath } = await createTestContext({
      versions: [],
      lockfile: undefined,
    });

    await expect(createUCDStore({
      fs: fsFactory,
      basePath,
      versions: ["16.0.0"],
    })).rejects.toThrow();
  });

  it("should fail when config versions don't match API versions", async () => {
    mockStoreApi({
      versions: ["15.0.0"], // API only has 15.0.0
      responses: {
        "/.well-known/ucd-config.json": {
          version: "0.1",
          endpoints: {
            files: "/api/v1/files",
            manifest: "/.well-known/ucd-store/{version}.json",
            versions: "/api/v1/versions",
          },
          versions: ["16.0.0", "15.1.0"], // Config claims these versions exist
        },
        "/api/v1/versions": true,
      },
    });

    const { fsFactory, basePath } = await createTestContext({
      versions: [],
      lockfile: undefined,
    });

    // Should fail because config versions (16.0.0, 15.1.0) are not in API (15.0.0)
    await expect(createUCDStore({
      fs: fsFactory,
      basePath,
      versions: [], // Use config versions
      bootstrap: true,
    })).rejects.toThrow();
  });
});
