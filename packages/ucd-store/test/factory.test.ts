import type { UCDStoreManifest } from "@ucdjs/schemas";
import { HttpResponse, mockFetch } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { assertCapability } from "@ucdjs/fs-bridge";
import { PRECONFIGURED_FILTERS } from "@ucdjs/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createHTTPUCDStore, createNodeUCDStore, createUCDStore } from "../src/factory";
import { UCDStore } from "../src/store";
import { createMemoryMockFS, createReadOnlyMockFS } from "./__shared";

const DEFAULT_VERSIONS = {
  "16.0.0": "/16.0.0",
  "15.1.0": "/15.1.0",
  "15.0.0": "/15.0.0",
} satisfies UCDStoreManifest;

describe("store configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("createUCDStore configurations", () => {
    it("should create store with custom filesystem bridge", async () => {
      const customFS = createMemoryMockFS();

      assertCapability(customFS, "write");
      // initialize with empty manifest
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
      const storeDir = await testdir({
        ".ucd-store.json": JSON.stringify({}),
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
        ".ucd-store.json": JSON.stringify({}),
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
      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/files/.ucd-store.json`, () => {
          return HttpResponse.json(DEFAULT_VERSIONS);
        }],
      ]);

      const store = await createHTTPUCDStore();

      expect(store).toBeInstanceOf(UCDStore);
      expect(store.baseUrl).toBe(UCDJS_API_BASE_URL);
      expect(store.basePath).toBe("");

      const fsCapabilities = store.fs.capabilities;
      expect(fsCapabilities).toBeDefined();
      expect(fsCapabilities.read).toBe(true);
      expect(fsCapabilities.write).toBe(false);
      expect(fsCapabilities.listdir).toBe(true);
      expect(fsCapabilities.mkdir).toBe(false);
      expect(fsCapabilities.exists).toBe(true);
      expect(fsCapabilities.rm).toBe(false);

      expect(store.versions).toEqual(Object.keys(DEFAULT_VERSIONS));
    });

    it("should create HTTP store with custom base URL", async () => {
      const customBaseUrl = "https://custom-http.ucdjs.dev";

      mockFetch([
        [["GET", "HEAD"], `${customBaseUrl}/.ucd-store.json`, () => {
          return HttpResponse.json(DEFAULT_VERSIONS);
        }],
      ]);

      const store = await createHTTPUCDStore({
        baseUrl: customBaseUrl,
      });

      expect(store.baseUrl).toBe(customBaseUrl);
      expect(store.basePath).toBe("");

      expect(store.versions).toEqual(Object.keys(DEFAULT_VERSIONS));
    });

    it("should create HTTP store with custom base path", async () => {
      const customBasePath = "/custom/api/path";

      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/files${customBasePath}/.ucd-store.json`, () => {
          return HttpResponse.json(DEFAULT_VERSIONS);
        }],
      ]);

      const store = await createHTTPUCDStore({
        basePath: customBasePath,
      });

      expect(store.basePath).toBe(customBasePath);
      expect(store.baseUrl).toBe(UCDJS_API_BASE_URL);

      expect(store.versions).toEqual(Object.keys(DEFAULT_VERSIONS));
    });

    it("should create HTTP store with global filters", async () => {
      const filters = ["*.txt", "!*debug*"];

      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/files/.ucd-store.json`, () => {
          return HttpResponse.json(DEFAULT_VERSIONS);
        }],
      ]);

      const store = await createHTTPUCDStore({
        globalFilters: filters,
      });

      expect(store.filter).toBeDefined();
      expect(store.basePath).toBe("");
      expect(store.filter.patterns()).toEqual(filters);

      expect(store.filter("DebugFile.txt")).toBe(false);
      expect(store.filter("ValidFile.txt")).toBe(true);
    });

    it("should create HTTP store with preconfigured filters", async () => {
      const filters = ["*.txt", PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES];

      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/files/.ucd-store.json`, () => {
          return HttpResponse.json(DEFAULT_VERSIONS);
        }],
      ]);

      const store = await createHTTPUCDStore({
        globalFilters: filters,
      });

      expect(store.filter).toBeDefined();
      expect(store.filter.patterns()).toContain(PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES);
      expect(store.filter("NormalizationTest.txt")).toBe(false);
      expect(store.filter("ValidFile.txt")).toBe(true);
    });
  });

  describe("store initialization", () => {
    it("should initialize with existing manifest", async () => {
      const manifest = {
        "15.1.0": "/15.1.0",
        "15.0.0": "/15.0.0",
      } satisfies UCDStoreManifest;

      const storeDir = await testdir({
        ".ucd-store.json": JSON.stringify(manifest),
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store.versions).toEqual(["15.1.0", "15.0.0"]);
    });

    it("should initialize with empty manifest for new store", async () => {
      const storeDir = await testdir({});

      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([]);
        }],
      ]);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store.versions).toEqual([]);
    });

    it("should handle malformed manifest", async () => {
      const storeDir = await testdir({
        ".ucd-store.json": "invalid json",
      });

      await expect(createNodeUCDStore({
        basePath: storeDir,
      })).rejects.toThrow("store manifest is not a valid JSON");
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
        ".ucd-store.json": JSON.stringify(DEFAULT_VERSIONS),
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
      const storeDir = await testdir({
        ".ucd-store.json": JSON.stringify(DEFAULT_VERSIONS),
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store.versions.includes("15.0.0")).toBe(true);
      expect(store.versions.includes("15.1.0")).toBe(true);
      expect(store.versions.includes("99.99.99")).toBe(false);
    });

    it("should handle version list immutability", async () => {
      const storeDir = await testdir({
        ".ucd-store.json": JSON.stringify(DEFAULT_VERSIONS),
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
        ".ucd-store.json": JSON.stringify(DEFAULT_VERSIONS),
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
        ".ucd-store.json": JSON.stringify(DEFAULT_VERSIONS),
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
