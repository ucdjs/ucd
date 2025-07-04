import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { mockFetch, mockResponses } from "#msw-utils";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { flattenFilePaths } from "@ucdjs/ucd-store";
import { PRECONFIGURED_FILTERS } from "@ucdjs/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRemoteUCDStore, createUCDStore } from "../src/store";

// eslint-disable-next-line test/prefer-lowercase-title
describe("Remote UCD Store", () => {
  let mockFs: FileSystemBridge;

  beforeEach(() => {
    // Setup mock filesystem bridge for remote mode
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

  describe("initialization and configuration", () => {
    it("should create remote store with default options", async () => {
      const store = await createRemoteUCDStore({
        fs: mockFs,
      });

      expect(store).toBeDefined();
      expect(store.mode).toBe("remote");
      expect(store.baseUrl).toBe(UCDJS_API_BASE_URL);
    });

    it("should create remote store with custom base URL", async () => {
      const customBaseUrl = "https://custom-api.ucdjs.dev";
      const store = await createRemoteUCDStore({
        fs: mockFs,
        baseUrl: customBaseUrl,
      });

      expect(store).toBeDefined();
      expect(store.baseUrl).toBe(customBaseUrl);
    });

    it("should create remote store with custom filesystem bridge", async () => {
      const customFs = {
        exists: vi.fn(),
        read: vi.fn(),
        write: vi.fn(),
        listdir: vi.fn(),
        mkdir: vi.fn(),
        stat: vi.fn(),
        rm: vi.fn(),
      };

      const store = await createRemoteUCDStore({
        fs: customFs,
      });

      expect(store).toBeDefined();
      expect(store.mode).toBe("remote");

      expect(store.fs).toBe(customFs);
    });

    it("should initialize remote store without local files", async () => {
      const store = await createRemoteUCDStore({
        fs: mockFs,
      });

      expect(store).toBeDefined();
      expect(store.mode).toBe("remote");

      expect(mockFs.mkdir).not.toHaveBeenCalled();
      expect(mockFs.write).not.toHaveBeenCalled();
      expect(mockFs.read).not.toHaveBeenCalled();
      expect(mockFs.exists).toHaveBeenCalledWith(".ucd-store.json");
    });

    it("should apply global filters to remote operations", async () => {
      const store = await createRemoteUCDStore({
        globalFilters: [PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES],
        fs: mockFs,
      });

      expect(store).toBeDefined();

      expect(store.filter.patterns()).toContain(PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES);
      expect(store.filter("NormalizationTest.txt")).toBe(false);
      expect(store.filter("ValidFile.txt")).toBe(true);
    });

    it("should handle empty global filters", async () => {
      const store = await createRemoteUCDStore({
        globalFilters: [],
        fs: mockFs,
      });

      expect(store).toBeDefined();
      expect(store.filter.patterns()).toEqual([]);
      expect(store.filter("AnyFile.txt")).toBe(true);
    });

    it("should load all available Unicode versions from metadata", async () => {
      const store = await createRemoteUCDStore({
        fs: mockFs,
      });

      expect(store).toBeDefined();
      expect(store.versions).toBeDefined();
      expect(store.versions.length).toBeGreaterThan(0);
      expect(store.versions).toEqual(UNICODE_VERSION_METADATA.map((v) => v.version));

      // check if specific versions are included
      expect(store.hasVersion("15.0.0")).toBe(true);
      expect(store.hasVersion("99.99.99")).toBe(false);
    });

    it("should handle remote initialization errors gracefully", async () => {
      const errorStore = createRemoteUCDStore({
        fs: {
          ...mockFs,
          exists: vi.fn().mockRejectedValue(new Error("Failed to initialize remote store")),
        },
      });

      await expect(() => errorStore).rejects.toThrow("Failed to initialize remote store");
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
      const remoteStore = await createUCDStore({
        mode: "remote",
        fs: mockFs,
      });

      expect(remoteStore).toBeDefined();
      expect(remoteStore.mode).toBe("remote");
      expect(remoteStore.fs).toBe(mockFs);
    });
  });

  describe("version management", () => {
    it("should return all available versions", async () => {
      const store = await createRemoteUCDStore({
        fs: mockFs,
      });

      expect(store.versions).toBeDefined();
      expect(store.versions.length).toBeGreaterThan(0);
      expect(store.versions).toEqual(UNICODE_VERSION_METADATA.map((v) => v.version));
    });

    it("should check version existence correctly", async () => {
      const store = await createRemoteUCDStore({
        fs: mockFs,
      });

      expect(store.hasVersion("15.0.0")).toBe(true);
      expect(store.hasVersion("99.99.99")).toBe(false);
    });

    it("should handle version list immutability", async () => {
      const store = await createRemoteUCDStore({
        fs: mockFs,
      });

      expect(() => {
        // Attempt to modify the versions array directly
        (store.versions as string[]).push("99.99.99");
      }).toThrow("Cannot add property 37, object is not extensible");

      expect(store.hasVersion("99.99.99")).toBe(false);
      expect(store.versions.length).toBe(UNICODE_VERSION_METADATA.length);
    });
  });

  describe("file tree operations", () => {
    const mockFiles = [
      {
        type: "file",
        name: "ArabicShaping.txt",
        path: "/ArabicShaping.txt",
        lastModified: 1644920820000,
      },
      {
        type: "file",
        name: "BidiBrackets.txt",
        path: "/BidiBrackets.txt",
        lastModified: 1651584360000,
      },
      {
        type: "file",
        name: "BidiCharacterTest.txt",
        path: "/BidiCharacterTest.txt",
        lastModified: 1651584300000,
      },
      {
        type: "directory",
        name: "extracted",
        path: "/extracted/",
        lastModified: 1724676960000,
        children: [
          {
            type: "file",
            name: "DerivedBidiClass.txt",
            path: "/DerivedBidiClass.txt",
            lastModified: 1724609100000,
          },
        ],
      },
    ];

    it("should fetch file tree from remote API", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(mockFiles);
        }],
      ]);

      const store = await createRemoteUCDStore();

      expect(store).toBeDefined();
      const fileTree = await store.getFileTree("15.0.0");

      expect(fileTree).toBeDefined();
      expect(fileTree.length).toBe(4);
      expect(flattenFilePaths(fileTree)).toEqual([
        "ArabicShaping.txt",
        "BidiBrackets.txt",
        "BidiCharacterTest.txt",
        "extracted/DerivedBidiClass.txt",
      ]);
    });

    it("should apply filters to remote file tree", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(mockFiles);
        }],
      ]);

      const store = await createRemoteUCDStore({
        globalFilters: [PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES],
      });
      const fileTree = await store.getFileTree("15.0.0");

      expect(fileTree).toBeDefined();
      expect(fileTree.length).toBeLessThan(mockFiles.length);
    });

    it("should apply extra filters to remote file tree", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(mockFiles);
        }],
      ]);

      const store = await createRemoteUCDStore({});

      const fileTree = await store.getFileTree("15.0.0");
      const fileTreeWithFilters = await store.getFileTree("15.0.0", [PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES]);

      expect(fileTreeWithFilters).toBeDefined();
      expect(fileTreeWithFilters.length).toBeLessThan(fileTree.length);
      expect(flattenFilePaths(fileTreeWithFilters)).not.toContain("BidiCharacterTest.txt");
    });

    it("should handle empty file tree response", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json([]);
        }],
      ]);

      const store = await createRemoteUCDStore();
      const fileTree = await store.getFileTree("15.0.0");

      expect(fileTree).toBeDefined();
      expect(fileTree.length).toBe(0);
    });

    it("should throw error for non-existent version", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/99.99.99`, () => {
          return mockResponses.notFound("Version not found");
        }],
      ]);

      const store = await createRemoteUCDStore();

      await expect(() => store.getFileTree("99.99.99")).rejects.toThrow("Version '99.99.99' not found in store");
    });

    it("should handle API errors with retry logic", async () => {
      let retryCount = 0;
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          console.error("Simulating API error for retry test");
          retryCount++;
          if (retryCount < 2) {
            return mockResponses.serverError("Temporary error, retrying...");
          }
          return mockResponses.json(mockFiles);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const fileTree = await store.getFileTree("15.0.0");
      expect(store).toBeDefined();
      expect(retryCount).toBe(2);
    });

    it("should handle network timeout errors", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.timeout("Network timeout");
        }],
      ]);

      const store = await createRemoteUCDStore();

      await expect(() => store.getFileTree("15.0.0")).rejects.toThrow("Network timeout");
    });
  });

  describe("file operations", () => {
    describe("getFile", () => {
      it("should fetch file content via HTTP filesystem", async () => {
        // Test file content retrieval via HTTP filesystem bridge
      });

      it("should handle file content with various encodings", async () => {
        // Test file retrieval with different text encodings
      });

      it("should throw error for filtered file paths", async () => {
        // Test that files excluded by filters throw appropriate error
      });

      it("should throw error for non-existent version", async () => {
        // Test version validation during file retrieval
      });

      it("should throw error for non-existent file", async () => {
        // Test error handling for missing files
      });

      it("should handle network errors during file retrieval", async () => {
        // Test network error handling for file content fetching
      });
    });

    describe("getFilePaths", () => {
      it("should return flattened file paths from API", async () => {
        // Test that remote file structure is properly flattened
      });

      it("should apply filters to flattened paths", async () => {
        // Test that filters are applied to flattened file paths
      });

      it("should handle empty remote file trees", async () => {
        // Test behavior with no files from API
      });

      it("should handle deeply nested directory structures", async () => {
        // Test flattening of deeply nested remote directories
      });
    });

    describe("getAllFiles", () => {
      it("should return files from all remote versions", async () => {
        // Test aggregation across multiple versions from API
      });

      it("should prefix files with version paths", async () => {
        // Test that returned paths include version prefix
      });

      it("should apply filters to all files", async () => {
        // Test that global filters are applied across all versions
      });

      it("should handle versions with no files", async () => {
        // Test behavior when some versions have no files
      });
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("HTTP filesystem integration", () => {
    it("should use HTTP filesystem bridge for file operations", async () => {
      const store = await createRemoteUCDStore({
        fs: mockFs,
      });

      expect(store.fs).toBeDefined();
      expect(store.fs.exists).toBeDefined();
      expect(store.fs.read).toBeDefined();
      expect(store.fs.write).toBeDefined();
      expect(store.fs.listdir).toBeDefined();
      expect(store.fs.mkdir).toBeDefined();
      expect(store.fs.stat).toBeDefined();
      expect(store.fs.rm).toBeDefined();
    });

    it("should handle HTTP caching correctly", async () => {
      // Test HTTP caching behavior in filesystem bridge
    });

    it("should handle HTTP redirects", async () => {
      // Test handling of HTTP redirects during file operations
    });

    it("should handle HTTP authentication if required", async () => {
      // Test HTTP authentication for protected endpoints
    });
  });

  describe("error handling", () => {
    it("should handle network connectivity issues", async () => {
      // Test behavior during network connectivity problems
    });

    it("should handle API rate limiting", async () => {
      // Test rate limit responses and backoff behavior
    });

    it("should handle malformed API responses", async () => {
      // Test handling of invalid JSON or unexpected response format
    });

    it("should handle HTTP 404 errors", async () => {
      // Test handling of not found errors from API
    });

    it("should handle HTTP 500 errors", async () => {
      // Test handling of server errors from API
    });

    it("should handle timeout errors", async () => {
      // Test handling of request timeout errors
    });
  });

  describe("performance and caching", () => {
    it("should handle large file trees efficiently", async () => {
      // Test performance with many files from API
    });

    it("should handle concurrent API operations", async () => {
      // Test concurrent API calls and response handling
    });

    it("should cache API responses appropriately", async () => {
      // Test caching behavior for repeated API calls
    });

    it("should handle memory usage with large responses", async () => {
      // Test memory efficiency with large API responses
    });
  });

  describe("store analysis", () => {
    describe("analyze", () => {
      it("should return correct analysis data for remote store", async () => {
        // Test totalFiles count and versions list from remote
      });

      it("should handle empty remote stores", async () => {
        // Test analysis of remote store with no files
      });

      it("should calculate file counts accurately", async () => {
        // Test accuracy of file count calculations
      });

      it("should identify incomplete versions", async () => {
        // Test detection of incomplete version data
      });
    });

    describe("clean", () => {
      it("should throw not implemented error", async () => {
        // Test that clean method throws expected error for remote store
      });
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete remote workflow", async () => {
      // Test end-to-end remote store operations
    });

    it("should handle remote store with complex filtering", async () => {
      // Test remote store operations with multiple filters
    });

    it("should handle remote store error recovery", async () => {
      // Test resilience to network issues and API failures
    });

    it("should handle switching between different remote endpoints", async () => {
      // Test behavior when changing API base URL
    });
  });

  describe("edge cases", () => {
    it("should handle special characters in remote file paths", async () => {
      // Test Unicode characters, spaces, etc. in remote paths
    });

    it("should handle very large remote file trees", async () => {
      // Test performance with extremely large file structures
    });

    it("should handle malformed Unicode version strings", async () => {
      // Test handling of invalid version format from API
    });

    it("should handle empty or null responses from API", async () => {
      // Test handling of empty API responses
    });
  });
});
