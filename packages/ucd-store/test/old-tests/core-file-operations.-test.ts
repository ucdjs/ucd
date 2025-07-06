import { HttpResponse, mockFetch, mockResponses } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { PRECONFIGURED_FILTERS } from "@ucdjs/utils";
import { describe, expect, it } from "vitest";
import { createRemoteUCDStore } from "../../src/factory";
import { flattenFilePaths } from "../../src/internal/flatten";

describe("remote ucd store - core file operations", () => {
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

  describe("getFile", () => {
    it("should fetch file content via HTTP filesystem", async () => {
      const mockFileContent = "# Arabic Shaping\n# Unicode Data\nThis is test content";

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/ArabicShaping.txt`, () => {
          return HttpResponse.text(mockFileContent);
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
          return HttpResponse.text(utf8Content);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/ASCIIFile.txt`, () => {
          return HttpResponse.text(asciiContent);
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
          return HttpResponse.error();
        }],
      ]);

      const store = await createRemoteUCDStore();

      await expect(() => store.getFile("15.0.0", "ArabicShaping.txt"))
        .rejects.toThrow("Failed to fetch");
    });
  });

  describe("getFilePaths", () => {
    it("should return flattened file paths from API", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
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
          return HttpResponse.json(mockFiles);
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
          return HttpResponse.json([]);
        }],
      ]);

      const store = await createRemoteUCDStore();
      const filePaths = await store.getFilePaths("15.0.0");

      expect(filePaths).toEqual([]);
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
          return HttpResponse.json(version1Files);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.1.0`, () => {
          return HttpResponse.json(version2Files);
        }],
      ]);

      const store = await createRemoteUCDStore();

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
          return HttpResponse.json([
            { type: "file", name: "TestFile.txt", path: "/TestFile.txt" },
          ]);
        }],
      ]);

      const store = await createRemoteUCDStore();

      Object.defineProperty(store, "versions", {
        value: Object.freeze(["15.0.0"]),
        writable: false,
      });

      const allFiles = await store.getAllFiles();

      expect(allFiles).toEqual(["15.0.0/TestFile.txt"]);
      expect(allFiles[0]).toMatch(/^15\.0\.0\//);
    });

    it("should apply filters to all files", async () => {
      const filesWithTests = [
        { type: "file", name: "UnicodeData.txt", path: "/UnicodeData.txt" },
        { type: "file", name: "NormalizationTest.txt", path: "/NormalizationTest.txt" },
      ];

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(filesWithTests);
        }],
      ]);

      const store = await createRemoteUCDStore({
        globalFilters: [PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES],
      });

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
          return HttpResponse.json([]);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.1.0`, () => {
          return HttpResponse.json([
            { type: "file", name: "OnlyFile.txt", path: "/OnlyFile.txt" },
          ]);
        }],
      ]);

      const store = await createRemoteUCDStore();

      Object.defineProperty(store, "versions", {
        value: Object.freeze(["15.0.0", "15.1.0"]),
        writable: false,
      });

      const allFiles = await store.getAllFiles();

      expect(allFiles).toEqual(["15.1.0/OnlyFile.txt"]);
    });
  });

  describe("getFileTree", () => {
    it("should fetch file tree from remote API", async () => {
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
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
          return HttpResponse.json(mockFiles);
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
          return HttpResponse.json(mockFiles);
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
          return HttpResponse.json([]);
        }],
      ]);

      const store = await createRemoteUCDStore();
      const fileTree = await store.getFileTree("15.0.0");

      expect(fileTree).toBeDefined();
      expect(fileTree.length).toBe(0);
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
          return HttpResponse.json(deeplyNestedFiles);
        }],
      ]);

      const store = await createRemoteUCDStore();
      const filePaths = await store.getFilePaths("15.0.0");

      expect(filePaths).toEqual(["level1/level2/deep-file.txt"]);
    });

    it("should handle very large remote file trees", async () => {
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
          return HttpResponse.json([largeNestedTree]);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const startTime = Date.now();
      const filePaths = await store.getFilePaths("15.0.0");
      const endTime = Date.now();

      expect(filePaths).toHaveLength(500);
      expect(filePaths[0]).toBe("large-dir/large-file-0.txt");
      expect(filePaths[499]).toBe("large-dir/large-file-499.txt");
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  it("should handle special characters in remote file paths", async () => {
    const specialFiles = [
      { type: "file", name: "File with spaces.txt", path: "/File with spaces.txt" },
      { type: "file", name: "文件-中文.txt", path: "/文件-中文.txt" },
      { type: "file", name: "file@#$%^&().txt", path: "/file@#$%^&().txt" },
    ];

    const specialContent = "Content with Unicode: 你好世界";

    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        return HttpResponse.json(specialFiles);
      }],
      [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/File%20with%20spaces.txt`, () => {
        return HttpResponse.text(specialContent);
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
});
