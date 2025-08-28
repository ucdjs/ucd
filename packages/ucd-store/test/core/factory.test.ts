import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createHTTPUCDStore, createNodeUCDStore, createUCDStore } from "../../src/factory";
import { UCDStore } from "../../src/store";
import { createMemoryMockFS, createReadOnlyMockFS } from "../__shared";

describe("factory functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("createUCDStore", () => {
    it("should create store with custom filesystem bridge", () => {
      const customFS = createMemoryMockFS();

      const store = createUCDStore({
        basePath: "/test",
        fs: customFS,
      });

      expect(store).toBeInstanceOf(UCDStore);
      expect(store.basePath).toBe("/test");
      expect(store.fs).toBe(customFS);
      expect(store.initialized).toBe(false);
    });

    it("should create store with custom base URL", () => {
      const customBaseUrl = "https://custom.api.ucdjs.dev";

      const store = createUCDStore({
        baseUrl: customBaseUrl,
        basePath: "/test",
        fs: createReadOnlyMockFS(),
      });

      expect(store.baseUrl).toBe(customBaseUrl);
      expect(store.basePath).toBe("/test");
      expect(store.initialized).toBe(false);
    });

    it("should create store with global filters", () => {
      const filters = ["*.txt", "!*test*"];

      const store = createUCDStore({
        basePath: "/test",
        globalFilters: filters,
        fs: createReadOnlyMockFS(),
      });

      expect(store.filter).toBeDefined();
      expect(store.basePath).toBe("/test");
      expect(store.initialized).toBe(false);
    });

    it("should create store with custom versions", () => {
      const versions = ["15.1.0", "15.0.0"];

      const store = createUCDStore({
        basePath: "/test",
        versions,
        fs: createReadOnlyMockFS(),
      });

      expect(store.versions).toEqual(versions);
      expect(store.initialized).toBe(false);
    });

    it("should use default options when not specified", () => {
      const store = createUCDStore({
        fs: createReadOnlyMockFS(),
      });

      expect(store.baseUrl).toBe(UCDJS_API_BASE_URL);
      expect(store.basePath).toBe("");
      expect(store.versions).toEqual([]);
      expect(store.initialized).toBe(false);
    });
  });

  describe("createNodeUCDStore", () => {
    it("should create Node.js store with default options", async () => {
      const store = await createNodeUCDStore();

      expect(store).toBeInstanceOf(UCDStore);
      expect(store.basePath).toBe("");
      expect(store.baseUrl).toBe(UCDJS_API_BASE_URL);
      expect(store.initialized).toBe(false);

      const fsCapabilities = store.fs.capabilities;
      expect(fsCapabilities).toBeDefined();
      expect(fsCapabilities.read).toBe(true);
      expect(fsCapabilities.write).toBe(true);
      expect(fsCapabilities.listdir).toBe(true);
      expect(fsCapabilities.mkdir).toBe(true);
      expect(fsCapabilities.exists).toBe(true);
      expect(fsCapabilities.rm).toBe(true);
    });

    it("should create Node.js store with custom base URL", async () => {
      const customBaseUrl = "https://custom.node.ucdjs.dev";
      const storeDir = await testdir();

      const store = await createNodeUCDStore({
        basePath: storeDir,
        baseUrl: customBaseUrl,
      });

      expect(store.baseUrl).toBe(customBaseUrl);
      expect(store.basePath).toBe(storeDir);
      expect(store.initialized).toBe(false);
    });

    it("should create Node.js store with global filters", async () => {
      const filters = ["*.txt", "!*backup*"];
      const storeDir = await testdir();

      const store = await createNodeUCDStore({
        basePath: storeDir,
        globalFilters: filters,
      });

      expect(store.filter).toBeDefined();
      expect(store.basePath).toBe(storeDir);
      expect(store.initialized).toBe(false);
    });

    it("should create Node.js store with custom versions", async () => {
      const versions = ["15.1.0", "14.0.0"];
      const storeDir = await testdir();

      const store = await createNodeUCDStore({
        basePath: storeDir,
        versions,
      });

      expect(store.versions).toEqual(versions);
      expect(store.initialized).toBe(false);
    });

    it("should throw error if Node.js bridge cannot be loaded", async () => {
      vi.doMock("@ucdjs/fs-bridge/bridges/node", () => ({
        default: null,
      }));

      await expect(createNodeUCDStore()).rejects.toThrow(
        "Node.js FileSystemBridge could not be loaded",
      );
    });
  });

  describe("createHTTPUCDStore", () => {
    it("should create HTTP store with default options", async () => {
      const store = await createHTTPUCDStore();

      expect(store).toBeInstanceOf(UCDStore);
      expect(store.baseUrl).toBe(UCDJS_API_BASE_URL);
      expect(store.basePath).toBe("");
      expect(store.initialized).toBe(false);

      const fsCapabilities = store.fs.capabilities;
      expect(fsCapabilities).toBeDefined();
      expect(fsCapabilities.read).toBe(true);
      expect(fsCapabilities.write).toBe(false);
      expect(fsCapabilities.listdir).toBe(true);
      expect(fsCapabilities.mkdir).toBe(false);
      expect(fsCapabilities.exists).toBe(true);
      expect(fsCapabilities.rm).toBe(false);
    });

    it("should create HTTP store with custom base URL", async () => {
      const customBaseUrl = "https://custom-http.ucdjs.dev";

      const store = await createHTTPUCDStore({
        baseUrl: customBaseUrl,
      });

      expect(store.baseUrl).toBe(customBaseUrl);
      expect(store.basePath).toBe("");
      expect(store.initialized).toBe(false);
    });

    it("should create HTTP store with custom base path", async () => {
      const customBasePath = "/custom/api/path";

      const store = await createHTTPUCDStore({
        basePath: customBasePath,
      });

      expect(store.basePath).toBe(customBasePath);
      expect(store.baseUrl).toBe(UCDJS_API_BASE_URL);
      expect(store.initialized).toBe(false);
    });

    it("should create HTTP store with global filters", async () => {
      const filters = ["*.txt", "!*debug*"];

      const store = await createHTTPUCDStore({
        globalFilters: filters,
      });

      expect(store.filter).toBeDefined();
      expect(store.basePath).toBe("");
      expect(store.filter.patterns()).toEqual(filters);
      expect(store.initialized).toBe(false);
    });

    it("should create HTTP store with custom versions", async () => {
      const versions = ["15.1.0", "14.0.0"];

      const store = await createHTTPUCDStore({
        versions,
      });

      expect(store.versions).toEqual(versions);
      expect(store.initialized).toBe(false);
    });

    it("should configure HTTP filesystem bridge correctly", async () => {
      const baseUrl = "https://test.example.com";

      const store = await createHTTPUCDStore({
        baseUrl,
      });

      // HTTP bridge should be configured with the same baseUrl
      expect(store.baseUrl).toBe(baseUrl);
      expect(store.fs.capabilities.write).toBe(false);
      expect(store.fs.capabilities.read).toBe(true);
    });
  });
});
