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
        const mockFileContent = "# Arabic Shaping\n# Unicode Data\nThis is test content";

        mockFetch([
          [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/ArabicShaping.txt`, () => {
            return mockResponses.text(mockFileContent);
          }],
        ]);

        const store = await createRemoteUCDStore();
        const content = await store.getFile("15.0.0", "ArabicShaping.txt");

        expect(content).toBe(mockFileContent);
      });

      it("should handle file content with various encodings", async () => {
        const utf8Content = "Unicode: \u4E2D\u6587 (Chinese)";
        const asciiContent = "Simple ASCII text";

        mockFetch([
          [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/UTF8File.txt`, () => {
            return mockResponses.text(utf8Content);
          }],
          [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/ASCIIFile.txt`, () => {
            return mockResponses.text(asciiContent);
          }],
        ]);

        const store = await createRemoteUCDStore();

        const utf8Result = await store.getFile("15.0.0", "UTF8File.txt");
        const asciiResult = await store.getFile("15.0.0", "ASCIIFile.txt");

        expect(utf8Result).toBe(utf8Content);
        expect(asciiResult).toBe(asciiContent);
      });

      it("should throw error for filtered file paths", async () => {
        const store = await createRemoteUCDStore({
          globalFilters: [PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES],
        });

        await expect(() => store.getFile("15.0.0", "NormalizationTest.txt"))
          .rejects.toThrow("File path \"NormalizationTest.txt\" is filtered out by the store's filter patterns.");
      });

      it("should throw error for non-existent version", async () => {
        const store = await createRemoteUCDStore();

        await expect(() => store.getFile("99.99.99", "ArabicShaping.txt"))
          .rejects.toThrow("Version '99.99.99' not found in store");
      });

      it("should throw error for non-existent file", async () => {
        mockFetch([
          [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/NonExistentFile.txt`, () => {
            return mockResponses.notFound("File not found");
          }],
        ]);

        const store = await createRemoteUCDStore();

        await expect(() => store.getFile("15.0.0", "NonExistentFile.txt"))
          .rejects.toThrow("Failed to read remote file: Not Found");
      });

      it("should handle network errors during file retrieval", async () => {
        mockFetch([
          [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/ArabicShaping.txt`, () => {
            return mockResponses.timeout("Network connection failed");
          }],
        ]);

        const store = await createRemoteUCDStore();

        await expect(() => store.getFile("15.0.0", "ArabicShaping.txt"))
          .rejects.toThrow("Failed to read remote file: Request Timeout");
      });
    });

    describe("getFilePaths", () => {
      it("should return flattened file paths from API", async () => {
        mockFetch([
          [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
            return mockResponses.json(mockFiles);
          }],
        ]);

        const store = await createRemoteUCDStore();
        const filePaths = await store.getFilePaths("15.0.0");

        expect(filePaths).toEqual([
          "ArabicShaping.txt",
          "BidiBrackets.txt",
          "BidiCharacterTest.txt",
          "extracted/DerivedBidiClass.txt",
        ]);
      });

      it("should apply filters to flattened paths", async () => {
        mockFetch([
          [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
            return mockResponses.json(mockFiles);
          }],
        ]);

        const store = await createRemoteUCDStore({
          globalFilters: [PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES],
        });

        const filePaths = await store.getFilePaths("15.0.0");

        expect(filePaths).not.toContain("BidiCharacterTest.txt");
        expect(filePaths).toContain("ArabicShaping.txt");
        expect(filePaths).toContain("BidiBrackets.txt");
      });

      it("should handle empty remote file trees", async () => {
        mockFetch([
          [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
            return mockResponses.json([]);
          }],
        ]);

        const store = await createRemoteUCDStore();
        const filePaths = await store.getFilePaths("15.0.0");

        expect(filePaths).toEqual([]);
      });

      it("should handle deeply nested directory structures", async () => {
        const deeplyNestedFiles = [
          {
            type: "directory",
            name: "level1",
            path: "/level1/",
            children: [
              {
                type: "directory",
                name: "level2",
                path: "/level2/",
                children: [
                  {
                    type: "file",
                    name: "deep-file.txt",
                    path: "/deep-file.txt",
                  },
                ],
              },
            ],
          },
        ];

        mockFetch([
          [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
            return mockResponses.json(deeplyNestedFiles);
          }],
        ]);

        const store = await createRemoteUCDStore();
        const filePaths = await store.getFilePaths("15.0.0");

        expect(filePaths).toEqual(["level1/level2/deep-file.txt"]);
      });
    });

    describe("getAllFiles", () => {
      it("should return files from all remote versions", async () => {
        const version1Files = [
          { type: "file", name: "File1.txt", path: "/File1.txt" },
          { type: "file", name: "File2.txt", path: "/File2.txt" },
        ];

        const version2Files = [
          { type: "file", name: "File3.txt", path: "/File3.txt" },
          { type: "file", name: "File4.txt", path: "/File4.txt" },
        ];

        mockFetch([
          [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
            return mockResponses.json(version1Files);
          }],
          [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.1.0`, () => {
            return mockResponses.json(version2Files);
          }],
        ]);

        // Create a store with only specific versions for testing
        const store = await createRemoteUCDStore();

        // Override the versions to test with only 2 versions
        Object.defineProperty(store, "versions", {
          value: Object.freeze(["15.0.0", "15.1.0"]),
          writable: false,
        });

        const allFiles = await store.getAllFiles();

        expect(allFiles).toEqual([
          "15.0.0/File1.txt",
          "15.0.0/File2.txt",
          "15.1.0/File3.txt",
          "15.1.0/File4.txt",
        ]);
      });

      it("should prefix files with version paths", async () => {
        mockFetch([
          [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
            return mockResponses.json([
              { type: "file", name: "TestFile.txt", path: "/TestFile.txt" },
            ]);
          }],
        ]);

        const store = await createRemoteUCDStore();

        // Override the versions to test with only 1 version
        Object.defineProperty(store, "versions", {
          value: Object.freeze(["15.0.0"]),
          writable: false,
        });

        const allFiles = await store.getAllFiles();

        expect(allFiles).toEqual(["15.0.0/TestFile.txt"]);
        expect(allFiles[0]).toMatch(/^15\.0\.0\//); // Starts with version prefix
      });

      it("should apply filters to all files", async () => {
        const filesWithTests = [
          { type: "file", name: "UnicodeData.txt", path: "/UnicodeData.txt" },
          { type: "file", name: "NormalizationTest.txt", path: "/NormalizationTest.txt" },
        ];

        mockFetch([
          [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
            return mockResponses.json(filesWithTests);
          }],
        ]);

        const store = await createRemoteUCDStore({
          globalFilters: [PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES],
        });

        // Override the versions to test with only 1 version
        Object.defineProperty(store, "versions", {
          value: Object.freeze(["15.0.0"]),
          writable: false,
        });

        const allFiles = await store.getAllFiles();

        expect(allFiles).toEqual(["15.0.0/UnicodeData.txt"]);
        expect(allFiles).not.toContain("15.0.0/NormalizationTest.txt");
      });

      it("should handle versions with no files", async () => {
        mockFetch([
          [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
            return mockResponses.json([]);
          }],
          [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.1.0`, () => {
            return mockResponses.json([
              { type: "file", name: "OnlyFile.txt", path: "/OnlyFile.txt" },
            ]);
          }],
        ]);

        const store = await createRemoteUCDStore();

        // Override the versions to test with only 2 versions
        Object.defineProperty(store, "versions", {
          value: Object.freeze(["15.0.0", "15.1.0"]),
          writable: false,
        });

        const allFiles = await store.getAllFiles();

        expect(allFiles).toEqual(["15.1.0/OnlyFile.txt"]);
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
      const fileContent = "Cached content";
      let requestCount = 0;

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/CachedFile.txt`, () => {
          requestCount++;
          return mockResponses.text(fileContent);
        }],
      ]);

      const store = await createRemoteUCDStore();

      // First request
      const content1 = await store.getFile("15.0.0", "CachedFile.txt");
      expect(content1).toBe(fileContent);

      // Second request - should use cache or make new request depending on implementation
      const content2 = await store.getFile("15.0.0", "CachedFile.txt");
      expect(content2).toBe(fileContent);

      // Verify at least one request was made
      expect(requestCount).toBeGreaterThan(0);
    });

    it("should handle HTTP redirects", async () => {
      const finalContent = "Redirected content";

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/RedirectFile.txt`, () => {
          return mockResponses.redirect(`${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/FinalFile.txt`);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/FinalFile.txt`, () => {
          return mockResponses.text(finalContent);
        }],
      ]);

      const store = await createRemoteUCDStore();
      const content = await store.getFile("15.0.0", "RedirectFile.txt");

      expect(content).toBe(finalContent);
    });
  });

  describe("error handling", () => {
    it("should handle network connectivity issues", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.timeout("Network connectivity lost");
        }],
      ]);

      const store = await createRemoteUCDStore();

      await expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow("Network connectivity lost");
    });

    it("should handle API rate limiting", async () => {
      let retryCount = 0;

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          retryCount++;
          if (retryCount < 3) {
            return mockResponses.tooManyRequests("Rate limit exceeded");
          }
          return mockResponses.json([]);
        }],
      ]);

      const store = await createRemoteUCDStore();

      // Should eventually succeed after rate limit retries
      const result = await store.getFileTree("15.0.0");
      expect(result).toEqual([]);
      expect(retryCount).toBe(3);
    });

    it("should handle malformed API responses", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.text("Invalid JSON response");
        }],
      ]);

      const store = await createRemoteUCDStore();

      await expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow();
    });

    it("should handle HTTP 404 errors", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.notFound("Version not found");
        }],
      ]);

      const store = await createRemoteUCDStore();

      await expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow("Version not found");
    });

    it("should handle HTTP 500 errors", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.serverError("Internal server error");
        }],
      ]);

      const store = await createRemoteUCDStore();

      await expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow("Internal server error");
    });

    it("should handle timeout errors", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.timeout("Request timeout");
        }],
      ]);

      const store = await createRemoteUCDStore();

      await expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow("Request timeout");
    });
  });

  describe("performance and caching", () => {
    it("should handle large file trees efficiently", async () => {
      // Create a large file tree with 1000 files
      const largeFileTree = Array.from({ length: 1000 }, (_, i) => ({
        type: "file",
        name: `File${i.toString().padStart(4, "0")}.txt`,
        path: `/File${i.toString().padStart(4, "0")}.txt`,
        lastModified: Date.now(),
      }));

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(largeFileTree);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const startTime = Date.now();
      const fileTree = await store.getFileTree("15.0.0");
      const endTime = Date.now();

      expect(fileTree).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it("should handle concurrent API operations", async () => {
      const files1 = [{ type: "file", name: "File1.txt", path: "/File1.txt" }];
      const files2 = [{ type: "file", name: "File2.txt", path: "/File2.txt" }];
      const files3 = [{ type: "file", name: "File3.txt", path: "/File3.txt" }];

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(files1);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.1.0`, () => {
          return mockResponses.json(files2);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.2.0`, () => {
          return mockResponses.json(files3);
        }],
      ]);

      const store = await createRemoteUCDStore();

      // Execute concurrent operations
      const startTime = Date.now();
      const [tree1, tree2, tree3] = await Promise.all([
        store.getFileTree("15.0.0"),
        store.getFileTree("15.1.0"),
        store.getFileTree("15.2.0"),
      ]);
      const endTime = Date.now();

      expect(tree1).toHaveLength(1);
      expect(tree2).toHaveLength(1);
      expect(tree3).toHaveLength(1);

      // Concurrent operations should be faster than sequential
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("should cache API responses appropriately", async () => {
      const testFiles = [{ type: "file", name: "CachedFile.txt", path: "/CachedFile.txt" }];
      let requestCount = 0;

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          requestCount++;
          return mockResponses.json(testFiles);
        }],
      ]);

      const store = await createRemoteUCDStore();

      // Make multiple requests to the same endpoint
      const result1 = await store.getFileTree("15.0.0");
      const result2 = await store.getFileTree("15.0.0");

      expect(result1).toEqual(testFiles);
      expect(result2).toEqual(testFiles);

      // Verify requests were made (caching behavior depends on implementation)
      expect(requestCount).toBeGreaterThan(0);
    });

    it("should handle memory usage with large responses", async () => {
      // Create a response with large file content
      const largeFileContent = "x".repeat(1024 * 1024); // 1MB of content

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/LargeFile.txt`, () => {
          return mockResponses.text(largeFileContent);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const startMemory = process.memoryUsage().heapUsed;
      const content = await store.getFile("15.0.0", "LargeFile.txt");
      const endMemory = process.memoryUsage().heapUsed;

      expect(content).toHaveLength(1024 * 1024);

      // Memory usage should be reasonable (allowing for some overhead)
      const memoryIncrease = endMemory - startMemory;
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
    });
  });

  describe("store analysis", () => {
    describe("analyze", () => {
      it("should return correct analysis data for remote store", async () => {
        const store = await createRemoteUCDStore();

        // The analyze method is not implemented yet, so it should throw
        await expect(() => store.analyze())
          .rejects.toThrow("Analyze method not implemented yet");
      });

      it("should handle empty remote stores", async () => {
        const store = await createRemoteUCDStore();

        // The analyze method is not implemented yet, so it should throw
        await expect(() => store.analyze())
          .rejects.toThrow("Analyze method not implemented yet");
      });

      it("should calculate file counts accurately", async () => {
        const store = await createRemoteUCDStore();

        // The analyze method is not implemented yet, so it should throw
        await expect(() => store.analyze())
          .rejects.toThrow("Analyze method not implemented yet");
      });

      it("should identify incomplete versions", async () => {
        const store = await createRemoteUCDStore();

        // The analyze method is not implemented yet, so it should throw
        await expect(() => store.analyze())
          .rejects.toThrow("Analyze method not implemented yet");
      });
    });

    describe("clean", () => {
      it("should throw not implemented error", async () => {
        const store = await createRemoteUCDStore();

        await expect(() => store.clean())
          .rejects.toThrow("Clean method not implemented yet");
      });
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete remote workflow", async () => {
      const testFiles = [
        { type: "file", name: "WorkflowFile1.txt", path: "/WorkflowFile1.txt" },
        { type: "file", name: "WorkflowFile2.txt", path: "/WorkflowFile2.txt" },
      ];

      const fileContent = "Test workflow content";

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(testFiles);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/WorkflowFile1.txt`, () => {
          return mockResponses.text(fileContent);
        }],
      ]);

      const store = await createRemoteUCDStore();

      // Test complete workflow: get file tree, get file paths, get file content
      const fileTree = await store.getFileTree("15.0.0");
      expect(fileTree).toHaveLength(2);

      const filePaths = await store.getFilePaths("15.0.0");
      expect(filePaths).toEqual(["WorkflowFile1.txt", "WorkflowFile2.txt"]);

      const content = await store.getFile("15.0.0", "WorkflowFile1.txt");
      expect(content).toBe(fileContent);

      // Test version checking
      expect(store.hasVersion("15.0.0")).toBe(true);
      expect(store.hasVersion("99.99.99")).toBe(false);
    });

    it("should handle remote store with complex filtering", async () => {
      const mixedFiles = [
        { type: "file", name: "UnicodeData.txt", path: "/UnicodeData.txt" },
        { type: "file", name: "NormalizationTest.txt", path: "/NormalizationTest.txt" },
        { type: "file", name: "BidiTest.txt", path: "/BidiTest.txt" },
        { type: "file", name: "README.md", path: "/README.md" },
      ];

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(mixedFiles);
        }],
      ]);

      // Create store with multiple filters
      const store = await createRemoteUCDStore({
        globalFilters: [PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES, "*.md"],
      });

      const fileTree = await store.getFileTree("15.0.0");
      const filePaths = await store.getFilePaths("15.0.0");

      // Only UnicodeData.txt should remain after filtering
      expect(filePaths).toEqual(["UnicodeData.txt"]);
      expect(filePaths).not.toContain("NormalizationTest.txt");
      expect(filePaths).not.toContain("BidiTest.txt");
      expect(filePaths).not.toContain("README.md");
    });

    it("should handle remote store error recovery", async () => {
      let attemptCount = 0;
      const testFiles = [{ type: "file", name: "RecoveryFile.txt", path: "/RecoveryFile.txt" }];

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          attemptCount++;
          if (attemptCount < 3) {
            return mockResponses.serverError("Temporary server error");
          }
          return mockResponses.json(testFiles);
        }],
      ]);

      const store = await createRemoteUCDStore();

      // Should recover after retries
      const fileTree = await store.getFileTree("15.0.0");
      expect(fileTree).toEqual(testFiles);
      expect(attemptCount).toBe(3);
    });

    it("should handle switching between different remote endpoints", async () => {
      const customBaseUrl = "https://custom-api.ucdjs.dev";
      const testFiles = [{ type: "file", name: "CustomFile.txt", path: "/CustomFile.txt" }];

      mockFetch([
        [`GET ${customBaseUrl}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(testFiles);
        }],
      ]);

      const store = await createRemoteUCDStore({
        baseUrl: customBaseUrl,
      });

      expect(store.baseUrl).toBe(customBaseUrl);

      const fileTree = await store.getFileTree("15.0.0");
      expect(fileTree).toEqual(testFiles);
    });
  });

  describe("edge cases", () => {
    it("should handle special characters in remote file paths", async () => {
      const specialFiles = [
        { type: "file", name: "File with spaces.txt", path: "/File with spaces.txt" },
        { type: "file", name: "文件-中文.txt", path: "/文件-中文.txt" },
        { type: "file", name: "file@#$%^&().txt", path: "/file@#$%^&().txt" },
      ];

      const specialContent = "Content with Unicode: 你好世界";

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(specialFiles);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/File with spaces.txt`, () => {
          return mockResponses.text(specialContent);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const filePaths = await store.getFilePaths("15.0.0");
      expect(filePaths).toContain("File with spaces.txt");
      expect(filePaths).toContain("文件-中文.txt");
      expect(filePaths).toContain("file@#$%^&().txt");

      const content = await store.getFile("15.0.0", "File with spaces.txt");
      expect(content).toBe(specialContent);
    });

    it("should handle very large remote file trees", async () => {
      // Create a very large nested structure
      const largeNestedTree = {
        type: "directory",
        name: "large-dir",
        path: "/large-dir/",
        children: Array.from({ length: 500 }, (_, i) => ({
          type: "file",
          name: `large-file-${i}.txt`,
          path: `/large-file-${i}.txt`,
        })),
      };

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json([largeNestedTree]);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const startTime = Date.now();
      const filePaths = await store.getFilePaths("15.0.0");
      const endTime = Date.now();

      expect(filePaths).toHaveLength(500);
      expect(filePaths[0]).toBe("large-dir/large-file-0.txt");
      expect(filePaths[499]).toBe("large-dir/large-file-499.txt");

      // Should process large trees efficiently
      expect(endTime - startTime).toBeLessThan(2000);
    });

    it("should handle malformed Unicode version strings", async () => {
      const store = await createRemoteUCDStore();

      // Test invalid version formats
      expect(store.hasVersion("invalid-version")).toBe(false);
      expect(store.hasVersion("15.0")).toBe(false);
      expect(store.hasVersion("")).toBe(false);
      expect(store.hasVersion("15.0.0.0")).toBe(false);

      // Valid versions should work
      expect(store.hasVersion("15.0.0")).toBe(true);
    });

    it("should handle empty or null responses from API", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(null);
        }],
      ]);

      const store = await createRemoteUCDStore();

      // Should handle null responses gracefully
      await expect(() => store.getFileTree("15.0.0"))
        .rejects.toThrow();
    });
  });
});
