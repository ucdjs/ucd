import type { UnicodeVersionList } from "@ucdjs/schemas";
import fsp from "node:fs/promises";
import os from "node:os";
import { join } from "node:path";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { HttpResponse } from "msw";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { createTestStore } from "../src/test-store";

async function createOSTemporaryFolder() {
  const osTmpDir = os.tmpdir();
  const tmpUCDStoreFolder = join(osTmpDir, `tmp-ucd-store-test-${Date.now()}`);

  await fsp.mkdir(tmpUCDStoreFolder, { recursive: true }).catch(() => {
    expect.fail("Failed to create temporary directory for test store");
  });

  return tmpUCDStoreFolder;
}

describe("createTestStore", () => {
  describe("basic store creation", () => {
    it("should create a store with default configuration", async () => {
      const { store } = await createTestStore();

      expect(store).toBeDefined();
      expect(store.init).toBeDefined();
      expect(store.getFile).toBeDefined();
    });

    it("should auto-initialize by default", async () => {
      const { store } = await createTestStore();

      expect(store.initialized).toBe(true);
    });

    it("should skip initialization when autoInit is false", async () => {
      const { store } = await createTestStore({ autoInit: false });

      expect(store.initialized).toBe(false);
    });

    it("should use default versions when none provided", async () => {
      const { store } = await createTestStore();

      expect(store.versions).toEqual(["16.0.0", "15.1.0", "15.0.0"]);
    });

    it("should use custom versions when provided", async () => {
      const { store } = await createTestStore({
        versions: ["14.0.0", "13.0.0"],
      });

      expect(store.versions).toEqual(["14.0.0", "13.0.0"]);
    });

    it("should use custom baseUrl when provided", async () => {
      const { store } = await createTestStore({
        baseUrl: "https://custom.api.com",
      });

      expect(store.baseUrl).toBe("https://custom.api.com");
    });

    it("should create empty testdir when no options provided", async () => {
      const { store, storePath } = await createTestStore();

      expect(storePath).toBeDefined();
      expect(storePath).not.toBe("");
      expect(typeof storePath).toBe("string");
      expect(store).toBeDefined();
      expect(store.initialized).toBe(true);
    });
  });

  describe("with structure", () => {
    it("should create testdir with provided structure", async () => {
      const { store, storePath } = await createTestStore({
        structure: {
          "15.0.0": {
            "UnicodeData.txt": "test content",
          },
        },
      });

      expect(storePath).toBeDefined();
      expect(typeof storePath).toBe("string");
      expect(store).toBeDefined();
    });

    it("should create manifest file when manifest is provided", async () => {
      const manifest = {
        "15.0.0": "15.0.0",
      };

      const { store, storePath } = await createTestStore({
        manifest,
        structure: {
          "15.0.0": {},
        },
        testdirsOptions: {
          cleanup: false,
        },
      });

      expect(storePath).toBeDefined();

      const readManifest = await store["~readManifest"]();
      expect(readManifest).toEqual(manifest);
    });

    it("should create testdir with just manifest", async () => {
      const manifest = {
        "15.0.0": "15.0.0",
      };

      const { store, storePath } = await createTestStore({
        manifest,
      });

      expect(storePath).toBeDefined();
      expect(store).toBeDefined();

      const readManifest = await store["~readManifest"]();
      expect(readManifest).toEqual(manifest);
    });

    it("should handle empty structure object", async () => {
      const { store, storePath } = await createTestStore({
        structure: {},
      });

      expect(storePath).toBeDefined();
      expect(storePath).not.toBe("");
      expect(typeof storePath).toBe("string");
      expect(store).toBeDefined();
      expect(store.initialized).toBe(true);
    });

    it("should handle empty manifest object", async () => {
      const { store, storePath } = await createTestStore({
        manifest: {},
      });

      expect(storePath).toBeDefined();
      expect(typeof storePath).toBe("string");
      expect(store).toBeDefined();

      const readManifest = await store["~readManifest"]();
      expect(readManifest).toEqual({});
    });

    it("should pass testdirsOptions to testdir", async () => {
      const { store, storePath } = await createTestStore({
        structure: {
          "15.0.0": {
            "UnicodeData.txt": "test content",
          },
        },
        testdirsOptions: {
          cleanup: false,
        },
      });

      onTestFinished(async () => {
        await fsp.rm(storePath!, { recursive: true, force: true });
      });

      expect(storePath).toBeDefined();
      expect(typeof storePath).toBe("string");
      expect(store).toBeDefined();

      const dirStat = await fsp.stat(storePath!);
      expect(dirStat.isDirectory()).toBe(true);
    });
  });

  describe("with custom filesystem bridge", () => {
    it("should use custom fs bridge when provided", async () => {
      const mockFs = defineFileSystemBridge({
        setup() {
          return {
            read: vi.fn().mockResolvedValue("mock content"),
            write: vi.fn().mockResolvedValue(undefined),
            listdir: vi.fn().mockResolvedValue([]),
            exists: vi.fn().mockResolvedValue(true),
            mkdir: vi.fn().mockResolvedValue(undefined),
            rm: vi.fn().mockResolvedValue(undefined),
          };
        },
      })();

      const { store } = await createTestStore({
        fs: mockFs,
        autoInit: false,
      });

      expect(store).toBeDefined();
      expect(store.fs).toBe(mockFs);
    });

    it("should use basePath when custom fs is provided", async () => {
      const mockFs = defineFileSystemBridge({
        setup() {
          return {
            read: vi.fn().mockResolvedValue(""),
            write: vi.fn().mockResolvedValue(undefined),
            listdir: vi.fn().mockResolvedValue([]),
            exists: vi.fn().mockResolvedValue(true),
            mkdir: vi.fn().mockResolvedValue(undefined),
            rm: vi.fn().mockResolvedValue(undefined),
          };
        },
      })();

      const { storePath } = await createTestStore({
        fs: mockFs,
        basePath: "/custom/path",
        autoInit: false,
      });

      expect(storePath).toBe("/custom/path");
    });

    it("should not create testdir when basePath is provided", async () => {
      const tmpUCDStoreFolder = await createOSTemporaryFolder();

      onTestFinished(async () => {
        await fsp.rm(tmpUCDStoreFolder, { recursive: true, force: true });
      });

      const { store, storePath } = await createTestStore({
        basePath: tmpUCDStoreFolder,
        structure: {
          "15.0.0": {
            "UnicodeData.txt": "test content",
          },
        },
        autoInit: false,
      });

      expect(store).toBeDefined();
      expect(storePath).toBe(tmpUCDStoreFolder);

      const dirStat = await fsp.stat(tmpUCDStoreFolder);
      expect(dirStat.isDirectory()).toBe(true);

      const entries = await fsp.readdir(tmpUCDStoreFolder);
      expect(entries).toEqual([]);
    });

    it("should ignore manifest when basePath is provided", async () => {
      const tmpUCDStoreFolder = await createOSTemporaryFolder();

      onTestFinished(async () => {
        await fsp.rm(tmpUCDStoreFolder, { recursive: true, force: true });
      });

      const { store, storePath } = await createTestStore({
        basePath: tmpUCDStoreFolder,
        manifest: {
          "15.0.0": "15.0.0",
        },
        autoInit: false,
      });

      expect(store).toBeDefined();
      expect(storePath).toBe(tmpUCDStoreFolder);

      const dirStat = await fsp.stat(tmpUCDStoreFolder);
      expect(dirStat.isDirectory()).toBe(true);

      const entries = await fsp.readdir(tmpUCDStoreFolder);
      expect(entries).toEqual([]);

      // NOTE: reading manifest should return empty object
      // But this will throw an error, since the manifest doesn't exist.
      // Which is the expected behavior, and what we are testing for.
      const readManifest = await store["~readManifest"]().catch(() => ({}));
      expect(readManifest).toEqual({});
    });
  });

  describe("with global filters", () => {
    it("should apply global filters when provided", async () => {
      const { store } = await createTestStore({
        globalFilters: {
          include: ["**/*.txt"],
        },
      });

      expect(store.filter).toBeDefined();
      expect(store.filter.patterns()).toEqual(expect.objectContaining({
        include: ["**/*.txt"],
      }));
    });
  });

  describe("with API mocking", () => {
    it("should not set up API mocking when mockApi is false", async () => {
      try {
        const { store } = await createTestStore({
          mockApi: false,
        });

        expect(store).toBeDefined();
        expect(store.initialized).toBe(false);

        expect.fail(
          "mockStoreApi should have thrown an error, since /versions mocked is disabled\n"
          + "And MSW should throw have blocked it",
        );
      } catch (err) {
        const msg = (err as Error).message;
        expect(msg).toBe("[MSW] Cannot bypass a request when using the \"error\" strategy for the \"onUnhandledRequest\" option.");
      }
    });

    it("should use custom mock config when provided", async () => {
      let called = 0;
      const { store } = await createTestStore({
        versions: ["15.0.0"],
        mockApi: {
          responses: {
            "/api/v1/versions": () => {
              called += 1;
              return HttpResponse.json([
                {
                  version: "15.0.0",
                  documentationUrl: "https://example.com",
                  date: null,
                  url: "https://example.com",
                  mappedUcdVersion: null,
                  type: "stable",
                },
              ] as UnicodeVersionList);
            },
          },
        },
      });

      expect(store).toBeDefined();
      expect(store.initialized).toBe(true);
      expect(store.versions).toEqual(["15.0.0"]);

      expect(called).toBe(1);
    });

    it("should include manifest in mocked responses when manifest provided", async () => {
      const manifest = {
        "15.0.0": "15.0.0",
      };

      const { store } = await createTestStore({
        manifest,
        mockApi: true,
      });

      expect(store).toBeDefined();
      expect(store.initialized).toBe(true);

      const fetchedManifest = await store["~readManifest"]();
      expect(fetchedManifest).toEqual(manifest);

      const { data: fetchedData } = await store.client.GET("/api/v1/files/.ucd-store.json");
      expect(fetchedData).toEqual(manifest);
    });
  });

  describe("return value", () => {
    it("should return both store and storePath", async () => {
      const testStore = await createTestStore({
        structure: {
          "15.0.0": {
            "UnicodeData.txt": "test content",
          },
        },
      });

      expect(testStore).toBeDefined();
      expect(testStore.store).toBeDefined();
      expect(testStore.storePath).toBeDefined();
      expect(typeof testStore.storePath).toBe("string");
      expect(testStore.storePath).not.toBe("");
    });
  });
});
