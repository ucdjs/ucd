import { HttpResponse, mockFetch } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { __INTERNAL_BRIDGE_DEBUG_SYMBOL_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__ } from "@ucdjs/fs-bridge/internal";
import { PRECONFIGURED_FILTERS } from "@ucdjs/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createHTTPUCDStore, createNodeUCDStore, createUCDStore } from "../src/factory";
import { UCDStore } from "../src/store";
import { createMemoryMockFS, createReadOnlyMockFS } from "./__shared";

describe("store configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("createUCDStore configurations", () => {
    it("should create store with custom filesystem bridge", async () => {
      const customFS = createMemoryMockFS();

      // Initialize with empty manifest
      await customFS.write("/test/.ucd-store.json", "{}");

      const store = await createUCDStore({
        basePath: "/test",
        fs: customFS,
      });

      expect(store).toBeInstanceOf(UCDStore);
      expect(store.basePath).toBe("/test");
      expect(store.fs).toBe(customFS);
    });

    it("should create store with custom base URL", async () => {
      const customBaseUrl = "https://custom.api.ucdjs.dev";

      const store = await createUCDStore({
        baseUrl: customBaseUrl,
        basePath: "/test",
        fs: createReadOnlyMockFS(),
      });

      expect(store.baseUrl).toBe(customBaseUrl);
      expect(store.basePath).toBe("/test");
    });

    it("should create store with global filters", async () => {
      const filters = ["*.txt", "!*test*"];

      const store = await createUCDStore({
        basePath: "/test",
        globalFilters: filters,
        fs: createReadOnlyMockFS(),
      });

      expect(store.filter).toBeDefined();
      expect(store.basePath).toBe("/test");
    });
  });

  describe("createNodeUCDStore configurations", () => {
    it("should create Node.js store with default options", async () => {
      const storeDir = await testdir({
        ".ucd-store.json": JSON.stringify({}),
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store).toBeInstanceOf(UCDStore);
      expect(store.basePath).toBe(storeDir);
      expect(store.baseUrl).toBe(UCDJS_API_BASE_URL);

      const fsCapabilities = store.fs[__INTERNAL_BRIDGE_DEBUG_SYMBOL_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__];
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
      const storeDir = await testdir({
        ".ucd-store.json": "[]",
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
        baseUrl: customBaseUrl,
      });

      expect(store.baseUrl).toBe(customBaseUrl);
      expect(store.basePath).toBe(storeDir);
    });

    it("should create Node.js store with global filters", async () => {
      const filters = ["*.txt", "!*backup*"];
      const storeDir = await testdir({
        ".ucd-store.json": "[]",
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
        globalFilters: filters,
      });

      expect(store.filter).toBeDefined();
      expect(store.basePath).toBe(storeDir);
    });
  });

  describe("createHTTPUCDStore configurations", () => {
    it("should create HTTP store with default options", async () => {
      const store = await createHTTPUCDStore();

      expect(store).toBeInstanceOf(UCDStore);
      expect(store.baseUrl).toBe(UCDJS_API_BASE_URL);
      expect(store.basePath).toBe("");

      const fsCapabilities = store.fs[__INTERNAL_BRIDGE_DEBUG_SYMBOL_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__];
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

      mockFetch([
        [["GET", "HEAD"], `${customBaseUrl}/.ucd-store.json`, () => {
          return HttpResponse.json([]);
        }],
      ]);

      const store = await createHTTPUCDStore({
        baseUrl: customBaseUrl,
      });

      expect(store.baseUrl).toBe(customBaseUrl);
      expect(store.basePath).toBe("");
    });

    it("should create HTTP store with custom base path", async () => {
      const customBasePath = "/custom/api/path";

      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy${customBasePath}/.ucd-store.json`, () => {
          return HttpResponse.json([]);
        }],
      ]);

      const store = await createHTTPUCDStore({
        basePath: customBasePath,
      });

      expect(store.basePath).toBe(customBasePath);
      expect(store.baseUrl).toBe(UCDJS_API_BASE_URL);
    });

    it("should create HTTP store with global filters", async () => {
      const filters = ["*.txt", "!*debug*"];

      const store = await createHTTPUCDStore({
        globalFilters: filters,
      });

      expect(store.filter).toBeDefined();
      expect(store.basePath).toBe("");
    });

    it("should create HTTP store with preconfigured filters", async () => {
      const filters = ["*.txt", PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES];

      const store = await createHTTPUCDStore({
        globalFilters: filters,
      });

      expect(store.filter).toBeDefined();
      expect(store.filter.patterns()).toContain(PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES);
      expect(store.filter("NormalizationTest.txt")).toBe(false);
      expect(store.filter("ValidFile.txt")).toBe(true);
    });
  });

  describe("store capabilities configuration", () => {
    it("should infer capabilities from filesystem bridge", async () => {
      const store = await createUCDStore({
        basePath: "/test",
        fs: createReadOnlyMockFS(),
      });

      expect(store.capabilities.analyze).toBe(true);
      expect(store.capabilities.clean).toBe(false);
      expect(store.capabilities.mirror).toBe(false);
      expect(store.capabilities.repair).toBe(false);
    });

    it("should infer full capabilities from Node.js filesystem", async () => {
      const storeDir = await testdir({
        ".ucd-store.json": "[]",
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store.capabilities.analyze).toBe(true);
      expect(store.capabilities.clean).toBe(true);
      expect(store.capabilities.mirror).toBe(true);
      expect(store.capabilities.repair).toBe(true);
    });

    it("should infer limited capabilities from HTTP filesystem", async () => {
      const store = await createHTTPUCDStore();

      expect(store.capabilities.analyze).toBe(true);
      expect(store.capabilities.clean).toBe(false);
      expect(store.capabilities.mirror).toBe(false);
      expect(store.capabilities.repair).toBe(false);
    });
  });

  describe("store initialization", () => {
    it("should initialize with existing manifest", async () => {
      const manifest = [
        { version: "15.0.0", path: "15.0.0" },
        { version: "15.1.0", path: "15.1.0" },
      ];

      const storeDir = await testdir({
        ".ucd-store.json": JSON.stringify(manifest),
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store.versions).toEqual(["15.0.0", "15.1.0"]);
    });

    it("should initialize with empty manifest for new store", async () => {
      const storeDir = await testdir({});

      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/unicode-versions`, () => {
          return HttpResponse.json([]);
        }],
      ]);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store.versions).toEqual([]);
    });

    it("should handle malformed manifest gracefully", async () => {
      const storeDir = await testdir({
        ".ucd-store.json": "invalid json",
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store.versions).toEqual([]);
    });
  });

  describe("store client configuration", () => {
    it("should configure client with custom base URL", async () => {
      const customBaseUrl = "https://custom.client.ucdjs.dev";

      const store = await createUCDStore({
        baseUrl: customBaseUrl,
        basePath: "/test",
        fs: createReadOnlyMockFS(),
      });

      expect(store.client).toBeDefined();
      expect(store.baseUrl).toBe(customBaseUrl);
    });

    it("should use default base URL when not specified", async () => {
      const storeDir = await testdir({
        ".ucd-store.json": "[]",
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store.client).toBeDefined();
      expect(store.baseUrl).toBe(UCDJS_API_BASE_URL);
    });
  });

  describe("store version management", () => {
    it("should check version existence correctly", async () => {
      const manifest = [
        { version: "15.0.0", path: "15.0.0" },
        { version: "15.1.0", path: "15.1.0" },
      ];

      const storeDir = await testdir({
        ".ucd-store.json": JSON.stringify(manifest),
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store.versions.includes("15.0.0")).toBe(true);
      expect(store.versions.includes("15.1.0")).toBe(true);
      expect(store.versions.includes("99.99.99")).toBe(false);
    });

    it("should handle version list immutability", async () => {
      const manifest = [
        { version: "15.0.0", path: "15.0.0" },
        { version: "15.1.0", path: "15.1.0" },
      ];

      const storeDir = await testdir({
        ".ucd-store.json": JSON.stringify(manifest),
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const originalLength = store.versions.length;
      expect(() => {
        (store.versions as string[]).push("99.99.99");
      }).toThrowError(/Cannot add property \d+, object is not extensible/);

      expect(store.versions.includes("99.99.99")).toBe(false);
      expect(store.versions.length).toBe(originalLength);
    });
  });

  describe("store filter configuration", () => {
    it("should apply global filters with preconfigured patterns", async () => {
      const storeDir = await testdir({
        ".ucd-store.json": "[]",
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
        globalFilters: ["*.txt", PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES],
      });

      expect(store.filter).toBeDefined();
      expect(store.filter.patterns()).toContain(PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES);
      expect(store.filter("NormalizationTest.txt")).toBe(false);
      expect(store.filter("ValidFile.txt")).toBe(true);
    });

    it("should handle empty global filters", async () => {
      const storeDir = await testdir({
        ".ucd-store.json": "[]",
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
        globalFilters: [],
      });

      expect(store.filter).toBeDefined();
      expect(store.filter("AnyFile.txt")).toBe(true);
    });
  });
});
