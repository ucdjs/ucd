import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { describe, expect, it, vi } from "vitest";
import { createTestStore } from "../src/test-store";

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

      // Read the manifest using the hidden method
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
});
