import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { mockFetch, mockResponses } from "#msw-utils";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { PRECONFIGURED_FILTERS } from "@ucdjs/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRemoteUCDStore, createUCDStore } from "../../src/factory";

describe("remote ucd store - configuration and version management", () => {
  let mockFs: FileSystemBridge;

  beforeEach(() => {
    mockFs = {
      exists: vi.fn(),
      read: vi.fn(),
      write: vi.fn(),
      listdir: vi.fn(),
      mkdir: vi.fn(),
      stat: vi.fn(),
      rm: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("store initialization", () => {
    it("should create remote store with default options", async () => {
      const mockedFs = {
        ...mockFs,
        exists: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        }),
        read: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(JSON.stringify([{
              version: "15.0.0",
              path: "/15.0.0",
            }]));
          }
          return Promise.resolve("");
        }),
      };
      const store = await createRemoteUCDStore({
        fs: mockedFs,
      });

      expect(store).toBeDefined();
      expect(store.mode).toBe("remote");
      expect(store.baseUrl).toBe(UCDJS_API_BASE_URL);
    });

    it("should create remote store with custom base URL", async () => {
      const customBaseUrl = "https://custom-api.ucdjs.dev";

      const mockedFs = {
        ...mockFs,
        exists: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        }),
        read: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(JSON.stringify([{
              version: "15.0.0",
              path: "/15.0.0",
            }]));
          }
          return Promise.resolve("");
        }),
      };

      const store = await createRemoteUCDStore({
        fs: mockedFs,
        baseUrl: customBaseUrl,
      });

      expect(store).toBeDefined();
      expect(store.baseUrl).toBe(customBaseUrl);
    });

    it("should create remote store with custom filesystem bridge", async () => {
      const mockedFs = {
        ...mockFs,
        exists: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        }),
        read: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(JSON.stringify([{
              version: "15.0.0",
              path: "/15.0.0",
            }]));
          }
          return Promise.resolve("");
        }),
      };

      const store = await createRemoteUCDStore({
        fs: mockedFs,
      });

      expect(store).toBeDefined();
      expect(store.mode).toBe("remote");
      expect(store.fs).toBe(mockedFs);
    });

    it("should initialize remote store without local files", async () => {
      const mockedFs = {
        ...mockFs,
        exists: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        }),
        read: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(JSON.stringify([{
              version: "15.0.0",
              path: "/15.0.0",
            }]));
          }
          return Promise.resolve("");
        }),
      };

      const store = await createRemoteUCDStore({
        fs: mockedFs,
      });

      expect(store).toBeDefined();
      expect(store.mode).toBe("remote");
      expect(mockedFs.mkdir).not.toHaveBeenCalled();
      expect(mockedFs.write).not.toHaveBeenCalled();
      expect(mockedFs.read).toHaveBeenCalledWith(".ucd-store.json");
      expect(mockedFs.exists).toHaveBeenCalledWith(".ucd-store.json");
    });

    it("should create remote store with default HTTP filesystem", async () => {
      mockFetch([
        [`HEAD ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/.ucd-store.json`, () => {
          return mockResponses.head();
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/.ucd-store.json`, () => {
          return mockResponses.json([], 200);
        }],
      ]);

      const store = await createRemoteUCDStore();
      expect(store).toBeDefined();
      expect(store.mode).toBe("remote");
      expect(store.fs).toBeDefined();
      expect(store.versions).toBeDefined();
    });

    it("should create remote store via generic factory", async () => {
      const mockedFs = {
        ...mockFs,
        exists: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        }),
        read: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(JSON.stringify([{
              version: "15.0.0",
              path: "/15.0.0",
            }]));
          }
          return Promise.resolve("");
        }),
      };

      const remoteStore = await createUCDStore({
        mode: "remote",
        fs: mockedFs,
      });

      expect(remoteStore).toBeDefined();
      expect(remoteStore.mode).toBe("remote");
      expect(remoteStore.fs).toBe(mockedFs);
    });
  });

  describe("filter configuration", () => {
    it("should apply global filters to remote operations", async () => {
      const mockedFs = {
        ...mockFs,
        exists: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        }),
        read: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(JSON.stringify([{
              version: "15.0.0",
              path: "/15.0.0",
            }]));
          }
          return Promise.resolve("");
        }),
      };

      const store = await createRemoteUCDStore({
        globalFilters: [PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES],
        fs: mockedFs,
      });

      expect(store).toBeDefined();
      expect(store.filter.patterns()).toContain(PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES);
      expect(store.filter("NormalizationTest.txt")).toBe(false);
      expect(store.filter("ValidFile.txt")).toBe(true);
    });

    it("should handle empty global filters", async () => {
      const mockedFs = {
        ...mockFs,
        exists: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        }),
        read: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(JSON.stringify([{
              version: "15.0.0",
              path: "/15.0.0",
            }]));
          }
          return Promise.resolve("");
        }),
      };

      const store = await createRemoteUCDStore({
        globalFilters: [],
        fs: mockedFs,
      });

      expect(store).toBeDefined();
      expect(store.filter.patterns()).toEqual([]);
      expect(store.filter("AnyFile.txt")).toBe(true);
    });
  });

  describe("version management", () => {
    it("should return all available versions", async () => {
      const mockedFs = {
        ...mockFs,
        exists: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        }),
        read: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(JSON.stringify(UNICODE_VERSION_METADATA.map((v) => ({
              version: v.version,
              path: `/${v.version}`,
            }))));
          }
          return Promise.resolve("");
        }),
      };

      const store = await createRemoteUCDStore({
        fs: mockedFs,
      });

      expect(store.versions).toBeDefined();
      expect(store.versions.length).toBeGreaterThan(0);
      expect(store.versions).toEqual(UNICODE_VERSION_METADATA.map((v) => v.version));
    });

    it("should check version existence correctly", async () => {
      const mockedFs = {
        ...mockFs,
        exists: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        }),
        read: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(JSON.stringify([{
              version: "15.0.0",
              path: "/15.0.0",
            }]));
          }
          return Promise.resolve("");
        }),
      };

      const store = await createRemoteUCDStore({
        fs: mockedFs,
      });

      expect(store.hasVersion("15.0.0")).toBe(true);
      expect(store.hasVersion("99.99.99")).toBe(false);
    });

    it("should handle version list immutability", async () => {
      const mockedFs = {
        ...mockFs,
        exists: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        }),
        read: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(JSON.stringify(UNICODE_VERSION_METADATA.map((v) => ({
              version: v.version,
              path: `/${v.version}`,
            }))));
          }
          return Promise.resolve("");
        }),
      };

      const store = await createRemoteUCDStore({
        fs: mockedFs,
      });

      expect(() => {
        (store.versions as string[]).push("99.99.99");
      }).toThrowError(/Cannot add property \d+, object is not extensible/);

      expect(store.hasVersion("99.99.99")).toBe(false);
      expect(store.versions.length).toBe(UNICODE_VERSION_METADATA.length);
    });

    it("should load all available Unicode versions from metadata", async () => {
      const mockedFs = {
        ...mockFs,
        exists: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        }),
        read: vi.fn().mockImplementation((path) => {
          if (path === ".ucd-store.json") {
            return Promise.resolve(JSON.stringify(UNICODE_VERSION_METADATA.map((v) => ({
              version: v.version,
              path: `/${v.version}`,
            }))));
          }
          return Promise.resolve("");
        }),
      };

      const store = await createRemoteUCDStore({
        fs: mockedFs,
      });

      expect(store).toBeDefined();
      expect(store.versions).toBeDefined();
      expect(store.versions.length).toBeGreaterThan(0);
      expect(store.versions).toEqual(UNICODE_VERSION_METADATA.map((v) => v.version));
      expect(store.hasVersion("15.0.0")).toBe(true);
      expect(store.hasVersion("99.99.99")).toBe(false);
    });
  });
});
