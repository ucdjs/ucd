import type { FileSystemBridgeOperations } from "@ucdjs/fs-bridge";
import type { UCDStoreManifest } from "@ucdjs/schemas";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import NodeFileSystemBridge from "@ucdjs/fs-bridge/bridges/node";
import { HttpResponse, mockFetch } from "@ucdjs/test-utils-internal/msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createNodeUCDStore, createUCDStore } from "../src/factory";

const DEFAULT_VERSIONS = {
  "16.0.0": "16.0.0",
  "15.1.0": "15.1.0",
  "15.0.0": "15.0.0",
} satisfies UCDStoreManifest;

describe("store init", () => {
  beforeEach(() => {
    mockFetch([
      [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(UNICODE_VERSION_METADATA);
      }],
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/:version/file-tree`, () => {
        return HttpResponse.json([{
          type: "file",
          name: "ArabicShaping.txt",
          path: "ArabicShaping.txt",
          lastModified: 1724601900000,
        }]);
      }],
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/*`, () => {
        return HttpResponse.text(`Null Content`);
      }],
    ]);

    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("new store initialization", () => {
    it("should create new store with no versions specified", async () => {
      const storePath = await testdir();
      let expectCalled = false;

      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          expectCalled = true;
          return HttpResponse.json(UNICODE_VERSION_METADATA);
        }],
      ]);

      const store = createUCDStore({
        basePath: storePath,
        fs: NodeFileSystemBridge({
          basePath: storePath,
        }),
      });

      await store.init();

      expect(expectCalled).toBe(true);
      expect(store.versions).toEqual(UNICODE_VERSION_METADATA.map((v) => v.version));
      expect(store.initialized).toBe(true);
    });

    it("should create new store with specific versions", async () => {
      const storePath = await testdir();

      const store = createUCDStore({
        basePath: storePath,
        fs: NodeFileSystemBridge({
          basePath: storePath,
        }),
        versions: ["16.0.0", "15.1.0", "15.0.0"],
      });

      await store.init();

      expect(store.versions).toEqual(["16.0.0", "15.1.0", "15.0.0"]);
      expect(store.initialized).toBe(true);
    });

    it("should validate constructor versions against API", async () => {
      const storePath = await testdir();

      const store = createUCDStore({
        basePath: storePath,
        fs: NodeFileSystemBridge({
          basePath: storePath,
        }),
        versions: ["16.0.0", "15.1.0", "15.0.0", "99.9.9"],
      });

      await expect(store.init()).rejects.toThrow("Store manifest contains invalid versions that are not present in the fetched versions.");
      expect(store.initialized).toBe(false);
    });

    it("should handle API failures when fetching versions", async () => {
      const storePath = await testdir();

      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.error();
        }],
      ]);

      const store = createUCDStore({
        basePath: storePath,
        fs: NodeFileSystemBridge({
          basePath: storePath,
        }),
      });

      await expect(store.init()).rejects.toThrow("Failed to fetch");
      expect(store.initialized).toBe(false);
    });

    it("should respect dryRun option", async () => {
      const storePath = await testdir();

      const store = createUCDStore({
        basePath: storePath,
        fs: NodeFileSystemBridge({
          basePath: storePath,
        }),
      });

      await store.init({ dryRun: true });
      expect(store.initialized).toBe(true);
      expect(existsSync(join(storePath, ".ucd-store.json"))).toBe(false);
    });

    it("should create directory structure", async () => {
      const storePath = await testdir();

      const basePath = join(storePath, "files");

      const store = createUCDStore({
        basePath,
        fs: NodeFileSystemBridge({
          basePath,
        }),
      });

      await store.init();

      expect(store.basePath).toBe(basePath);
      const exists = existsSync(basePath);

      expect(exists).toBe(true);
    });
  });

  describe("existing store loading", () => {
    it("should load existing store with same versions", async () => {
      const storePath = await testdir({
        ".ucd-store.json": JSON.stringify(DEFAULT_VERSIONS),
      });

      const store = createUCDStore({
        basePath: storePath,
        fs: NodeFileSystemBridge({
          basePath: storePath,
        }),
        versions: Object.keys(DEFAULT_VERSIONS),
      });

      await store.init();

      expect(store.versions).toEqual(Object.keys(DEFAULT_VERSIONS));
      expect(store.initialized).toBe(true);
      expect(existsSync(join(storePath, ".ucd-store.json"))).toBe(true);

      const manifest = JSON.parse(await readFile(join(storePath, ".ucd-store.json"), "utf-8"));
      expect(manifest).toEqual(DEFAULT_VERSIONS);
    });

    it("should load existing store when no constructor versions", async () => {
      const storePath = await testdir({
        ".ucd-store.json": JSON.stringify(DEFAULT_VERSIONS),
      });

      const store = createUCDStore({
        basePath: storePath,
        fs: NodeFileSystemBridge({
          basePath: storePath,
        }),
      });

      await store.init();

      expect(store.versions).toEqual(Object.keys(DEFAULT_VERSIONS));
      expect(store.initialized).toBe(true);
      expect(existsSync(join(storePath, ".ucd-store.json"))).toBe(true);

      const manifest = JSON.parse(await readFile(join(storePath, ".ucd-store.json"), "utf-8"));
      expect(manifest).toEqual(DEFAULT_VERSIONS);
    });

    it("should handle corrupted manifest file", async () => {
      const storePath = await testdir({
        ".ucd-store.json": "invalid json",
      });

      const store = createUCDStore({
        basePath: storePath,
        fs: NodeFileSystemBridge({
          basePath: storePath,
        }),
      });

      await expect(store.init()).rejects.toThrow("store manifest is not a valid JSON");
      expect(store.initialized).toBe(false);
    });

    it("should handle invalid manifest schema", async () => {
      const storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          invalid: {
            schema: "wrong",
          },
        }),
      });

      const store = createUCDStore({
        basePath: storePath,
        fs: NodeFileSystemBridge({
          basePath: storePath,
        }),
      });

      await expect(store.init()).rejects.toThrow("store manifest is not a valid JSON");
      expect(store.initialized).toBe(false);
    });

    it("should handle empty manifest", async () => {
      const storePath = await testdir({
        ".ucd-store.json": JSON.stringify({}),
      });

      const store = createUCDStore({
        basePath: storePath,
        fs: NodeFileSystemBridge({
          basePath: storePath,
        }),
      });

      await store.init();

      expect(store.versions).toEqual([]);
      expect(store.initialized).toBe(true);
      expect(existsSync(join(storePath, ".ucd-store.json"))).toBe(true);

      const manifest = JSON.parse(await readFile(join(storePath, ".ucd-store.json"), "utf-8"));
      expect(manifest).toEqual({});
    });
  });

  describe("version diff handling", () => {
    it("should handle constructor versions not in existing store", async () => {
      const storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
        versions: ["15.1.0"],
      });

      await store.init();

      expect(store.versions).toEqual(["15.1.0", "15.0.0"]);
      expect(store.initialized).toBe(true);

      expect(existsSync(join(storePath, ".ucd-store.json"))).toBe(true);
      const manifest = JSON.parse(await readFile(join(storePath, ".ucd-store.json"), "utf-8"));
      expect(manifest).toEqual({
        "15.0.0": "15.0.0",
        "15.1.0": "15.1.0",
      });
    });

    it("should handle existing store versions not in constructor", async () => {
      const storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
          "15.1.0": "15.1.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
        versions: ["15.0.0"],
      });

      await store.init();

      expect(store.versions).toEqual([
        "15.0.0",
        "15.1.0",
      ]);
      expect(store.initialized).toBe(true);

      expect(existsSync(join(storePath, ".ucd-store.json"))).toBe(true);
      const manifest = JSON.parse(await readFile(join(storePath, ".ucd-store.json"), "utf-8"));
      expect(manifest).toEqual({
        "15.0.0": "15.0.0",
        "15.1.0": "15.1.0",
      });
    });

    it("should handle completely different version sets", async () => {
      const storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
        versions: ["16.0.0", "15.1.0"],
      });

      await store.init();

      expect(store.versions).toEqual(["16.0.0", "15.1.0", "15.0.0"]);
      expect(store.initialized).toBe(true);

      expect(existsSync(join(storePath, ".ucd-store.json"))).toBe(true);
      const manifest = JSON.parse(await readFile(join(storePath, ".ucd-store.json"), "utf-8"));
      expect(manifest).toEqual({
        "15.0.0": "15.0.0",
        "15.1.0": "15.1.0",
        "16.0.0": "16.0.0",
      });
    });

    it("should merge versions correctly when there are differences", async () => {
      const storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
          "15.1.0": "15.1.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
        versions: ["15.1.0", "16.0.0"],
      });

      await store.init();

      expect(store.versions).toEqual(["15.1.0", "16.0.0", "15.0.0"]);
      expect(store.initialized).toBe(true);

      expect(existsSync(join(storePath, ".ucd-store.json"))).toBe(true);
      const manifest = JSON.parse(await readFile(join(storePath, ".ucd-store.json"), "utf-8"));
      expect(manifest).toEqual({
        "15.0.0": "15.0.0",
        "15.1.0": "15.1.0",
        "16.0.0": "16.0.0",
      });
    });
  });

  it.todo("handle force", () => {
    // handle force flag
  });

  describe("capability validation", async () => {
    const storePath = await testdir();

    beforeEach(() => {
      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(UNICODE_VERSION_METADATA);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/:version/file-tree`, () => {
          return HttpResponse.json([{
            type: "file",
            name: "ArabicShaping.txt",
          }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/:version/ucd/:file`, ({ params }) => {
          return HttpResponse.text(`Content of ${params.file}`);
        }],
      ]);
    });

    it.each([
      {
        capability: "exists",
        setup: () => ({}),
      },
      {
        capability: "read",
        setup: () => ({
          exists: () => true,
        }),
      },
    ])("should require $capability capability", async ({ capability, setup }) => {
      const store = createUCDStore({
        basePath: storePath,
        fs: defineFileSystemBridge({
          setup,
        })(),
      });

      await expect(store.init()).rejects.toThrow(`File system bridge does not support the '${capability}' capability.`);
    });

    it.each([
      {
        capability: "mkdir",
        setup: () => ({
          exists: async () => false,
          read: async () => "{}",
          write: async () => { },
        } satisfies FileSystemBridgeOperations),
      },
      {
        capability: "write",
        setup: () => ({
          exists: async () => false,
          read: async () => "{}",
          mkdir: async () => { },
        } satisfies FileSystemBridgeOperations),
      },
    ])("should require $capability capability for new stores", async ({ capability, setup }) => {
      const store = createUCDStore({
        basePath: storePath,
        fs: defineFileSystemBridge({
          setup,
        })(),
      });

      await expect(store.init()).rejects.toThrow(`File system bridge does not support the '${capability}' capability.`);
    });
  });
});
