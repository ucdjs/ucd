import { HttpResponse, mockFetch } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { PRECONFIGURED_FILTERS } from "@ucdjs/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { UCDStoreError } from "../src/errors";
import { createHTTPUCDStore, createNodeUCDStore, createUCDStore } from "../src/factory";
import { createMemoryMockFS } from "./__shared";

describe("file operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("getFileTree", () => {
    it("should get file tree for local store", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
          "BidiBrackets.txt": "Bidi brackets data",
          "extracted": {
            "DerivedBidiClass.txt": "Derived bidi class data",
            "nested": {
              "DeepFile.txt": "Deep nested file",
            },
          },
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const tree = await store.getFileTree("15.0.0");

      expect(tree).toHaveLength(3);
      expect(tree.map((f) => f.name)).toContain("ArabicShaping.txt");
      expect(tree.map((f) => f.name)).toContain("BidiBrackets.txt");
      expect(tree.map((f) => f.name)).toContain("extracted");

      const extractedDir = tree.find((f) => f.name === "extracted");
      expect(extractedDir?.children).toBeDefined();
      expect(extractedDir?.children).toHaveLength(2);
    });

    it("should get file tree for remote store", async () => {
      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/.ucd-store.json`, () => {
          return HttpResponse.json([{ version: "15.0.0", path: "/15.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/15.0.0/.ucd-store.json`, () => {
          return HttpResponse.json([
            { type: "file", name: "ArabicShaping.txt", path: "/ArabicShaping.txt" },
            { type: "file", name: "BidiBrackets.txt", path: "/BidiBrackets.txt" },
          ]);
        }],
      ]);

      const store = await createHTTPUCDStore();

      const tree = await store.getFileTree("15.0.0");

      expect(tree).toHaveLength(2);
      expect(tree.map((f) => f.name)).toContain("ArabicShaping.txt");
      expect(tree.map((f) => f.name)).toContain("BidiBrackets.txt");
    });

    it("should apply extra filters to file tree", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
          "BidiBrackets.txt": "Bidi brackets data",
          "TestFile.txt": "Test file that should be filtered",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const tree = await store.getFileTree("15.0.0", ["!*Test*"]);

      expect(tree).toHaveLength(2);
      expect(tree.map((f) => f.name)).toContain("ArabicShaping.txt");
      expect(tree.map((f) => f.name)).toContain("BidiBrackets.txt");
      expect(tree.map((f) => f.name)).not.toContain("TestFile.txt");
    });

    it("should handle nested directories", async () => {
      const storeStructure = {
        "15.0.0": {
          level1: {
            "level2": {
              "level3": {
                "DeepFile.txt": "Deep nested file",
              },
              "MidFile.txt": "Mid level file",
            },
            "ShallowFile.txt": "Shallow file",
          },
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const tree = await store.getFileTree("15.0.0");

      expect(tree).toHaveLength(1);
      const level1 = tree[0];
      expect(level1?.name).toBe("level1");
      expect(level1?.children).toHaveLength(2);

      const level2 = level1?.children?.find((f) => f.name === "level2");
      expect(level2?.children).toHaveLength(2);
      expect(level2?.children?.map((f) => f.name)).toContain("level3");
      expect(level2?.children?.map((f) => f.name)).toContain("MidFile.txt");
    });

    it("should throw error for non-existent version", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      await expect(store.getFileTree("99.99.99")).rejects.toThrow(UCDStoreError);
      await expect(store.getFileTree("99.99.99")).rejects.toThrow("Version '99.99.99' not found in store");
    });
  });

  describe("getFilePaths", () => {
    it("should get all file paths for a version", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
          "BidiBrackets.txt": "Bidi brackets data",
          "extracted": {
            "DerivedBidiClass.txt": "Derived bidi class data",
          },
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const paths = await store.getFilePaths("15.0.0");

      expect(paths).toHaveLength(3);
      expect(paths).toContain("ArabicShaping.txt");
      expect(paths).toContain("BidiBrackets.txt");
      expect(paths).toContain("extracted/DerivedBidiClass.txt");
    });

    it("should flatten nested directory structure", async () => {
      const storeStructure = {
        "15.0.0": {
          "level1": {
            "level2": {
              "level3": {
                "DeepFile.txt": "Deep nested file",
              },
              "MidFile.txt": "Mid level file",
            },
            "ShallowFile.txt": "Shallow file",
          },
          "RootFile.txt": "Root level file",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const paths = await store.getFilePaths("15.0.0");

      expect(paths).toHaveLength(4);
      expect(paths).toContain("RootFile.txt");
      expect(paths).toContain("level1/ShallowFile.txt");
      expect(paths).toContain("level1/level2/MidFile.txt");
      expect(paths).toContain("level1/level2/level3/DeepFile.txt");
    });

    it("should apply filters to file paths", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
          "TestFile.txt": "Test file",
          "BidiBrackets.txt": "Bidi brackets data",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const paths = await store.getFilePaths("15.0.0", ["!*Test*"]);

      expect(paths).toHaveLength(2);
      expect(paths).toContain("ArabicShaping.txt");
      expect(paths).toContain("BidiBrackets.txt");
      expect(paths).not.toContain("TestFile.txt");
    });

    it("should handle empty version directory", async () => {
      const storeStructure = {
        "15.0.0": {},
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const paths = await store.getFilePaths("15.0.0");

      expect(paths).toEqual([]);
    });
  });

  describe("getFile", () => {
    it("should read file from local store", async () => {
      const fileContent = "Arabic shaping data for Unicode";
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": fileContent,
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const content = await store.getFile("15.0.0", "ArabicShaping.txt");

      expect(content).toBe(fileContent);
    });

    it("should read file from remote store", async () => {
      const fileContent = "Remote Arabic shaping data";

      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/.ucd-store.json`, () => {
          return HttpResponse.json([{ version: "15.0.0", path: "/15.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/15.0.0/ArabicShaping.txt`, () => {
          return new Response(fileContent);
        }],
      ]);

      const store = await createHTTPUCDStore();

      const content = await store.getFile("15.0.0", "ArabicShaping.txt");

      expect(content).toBe(fileContent);
    });

    it("should apply filters before reading", async () => {
      const storeStructure = {
        "15.0.0": {
          "TestFile.txt": "This should be filtered out",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
        globalFilters: ["!*Test*"],
      });

      await expect(store.getFile("15.0.0", "TestFile.txt")).rejects.toThrow(UCDStoreError);
      await expect(store.getFile("15.0.0", "TestFile.txt")).rejects.toThrow("is filtered out by the store's filter patterns");
    });

    it("should handle file not found", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      await expect(store.getFile("15.0.0", "NonExistent.txt")).rejects.toThrow();
    });

    it("should handle filtered out files", async () => {
      const storeStructure = {
        "15.0.0": {
          "NormalizationTest.txt": "Test file content",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      await expect(store.getFile("15.0.0", "NormalizationTest.txt", ["!*Test*"])).rejects.toThrow(UCDStoreError);
    });
  });

  describe("getAllFiles", () => {
    it("should get all files across all versions", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data v15.0.0",
          "BidiBrackets.txt": "Bidi brackets data v15.0.0",
        },
        "15.1.0": {
          "ArabicShaping.txt": "Arabic shaping data v15.1.0",
          "PropertyAliases.txt": "Property aliases v15.1.0",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
          { version: "15.1.0", path: "15.1.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const allFiles = await store.getAllFiles();

      expect(allFiles).toHaveLength(4);
      expect(allFiles).toContain("15.0.0/ArabicShaping.txt");
      expect(allFiles).toContain("15.0.0/BidiBrackets.txt");
      expect(allFiles).toContain("15.1.0/ArabicShaping.txt");
      expect(allFiles).toContain("15.1.0/PropertyAliases.txt");
    });

    it("should handle multiple versions", async () => {
      const storeStructure = {
        "14.0.0": {
          "File1.txt": "File 1 v14.0.0",
        },
        "15.0.0": {
          "File2.txt": "File 2 v15.0.0",
        },
        "15.1.0": {
          "File3.txt": "File 3 v15.1.0",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "14.0.0", path: "14.0.0" },
          { version: "15.0.0", path: "15.0.0" },
          { version: "15.1.0", path: "15.1.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const allFiles = await store.getAllFiles();

      expect(allFiles).toHaveLength(3);
      expect(allFiles).toContain("14.0.0/File1.txt");
      expect(allFiles).toContain("15.0.0/File2.txt");
      expect(allFiles).toContain("15.1.0/File3.txt");
    });

    it("should apply extra filters", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
          "TestFile.txt": "Test file",
        },
        "15.1.0": {
          "BidiBrackets.txt": "Bidi brackets data",
          "AnotherTestFile.txt": "Another test file",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
          { version: "15.1.0", path: "15.1.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const allFiles = await store.getAllFiles(["!*Test*"]);

      expect(allFiles).toHaveLength(2);
      expect(allFiles).toContain("15.0.0/ArabicShaping.txt");
      expect(allFiles).toContain("15.1.0/BidiBrackets.txt");
      expect(allFiles).not.toContain("15.0.0/TestFile.txt");
      expect(allFiles).not.toContain("15.1.0/AnotherTestFile.txt");
    });

    it("should handle empty store", async () => {
      const storeStructure = {
        ".ucd-store.json": JSON.stringify([]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const allFiles = await store.getAllFiles();

      expect(allFiles).toEqual([]);
    });
  });

  describe("hasVersion", () => {
    it("should return true for existing version", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store.hasVersion("15.0.0")).toBe(true);
    });

    it("should return false for non-existing version", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store.hasVersion("99.99.99")).toBe(false);
      expect(store.hasVersion("14.0.0")).toBe(false);
    });
  });

  describe("filter integration", () => {
    it("should respect global filters", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
          "NormalizationTest.txt": "Test file that should be filtered",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
        globalFilters: [PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES],
      });

      const paths = await store.getFilePaths("15.0.0");

      expect(paths).toHaveLength(1);
      expect(paths).toContain("ArabicShaping.txt");
      expect(paths).not.toContain("NormalizationTest.txt");
    });

    it("should combine global and extra filters", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
          "TestFile.txt": "Test file",
          "DebugFile.txt": "Debug file",
          "NormalizationTest.txt": "Normalization test file",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
        globalFilters: [PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES],
      });

      const paths = await store.getFilePaths("15.0.0", ["!*Debug*"]);

      expect(paths).toHaveLength(2);
      expect(paths).toContain("ArabicShaping.txt");
      expect(paths).toContain("TestFile.txt");
      expect(paths).not.toContain("DebugFile.txt");
      expect(paths).not.toContain("NormalizationTest.txt");
    });

    it("should handle preconfigured filter patterns", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
          "NormalizationTest.txt": "Normalization test",
          "GraphemeBreakTest.txt": "Grapheme break test",
          "BidiTest.txt": "Bidi test",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
        globalFilters: [PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES],
      });

      expect(store.filter("NormalizationTest.txt")).toBe(false);
      expect(store.filter("GraphemeBreakTest.txt")).toBe(false);
      expect(store.filter("BidiTest.txt")).toBe(false);
      expect(store.filter("ArabicShaping.txt")).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle special characters in file names", async () => {
      const storeStructure = {
        "15.0.0": {
          "File with spaces.txt": "File with spaces",
          "File-with-dashes.txt": "File with dashes",
          "File_with_underscores.txt": "File with underscores",
          "File.with.dots.txt": "File with dots",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const paths = await store.getFilePaths("15.0.0");

      expect(paths).toHaveLength(4);
      expect(paths).toContain("File with spaces.txt");
      expect(paths).toContain("File-with-dashes.txt");
      expect(paths).toContain("File_with_underscores.txt");
      expect(paths).toContain("File.with.dots.txt");
    });

    it("should handle deeply nested directories", async () => {
      const storeStructure = {
        "15.0.0": {
          a: {
            b: {
              c: {
                d: {
                  e: {
                    f: {
                      "DeepFile.txt": "Very deep file",
                    },
                  },
                },
              },
            },
          },
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const paths = await store.getFilePaths("15.0.0");

      expect(paths).toHaveLength(1);
      expect(paths[0]).toBe("a/b/c/d/e/f/DeepFile.txt");

      const content = await store.getFile("15.0.0", "a/b/c/d/e/f/DeepFile.txt");
      expect(content).toBe("Very deep file");
    });

    it("should handle large file trees", async () => {
      const storeStructure: any = {
        "15.0.0": {},
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      // Create 100 files
      for (let i = 0; i < 100; i++) {
        storeStructure["15.0.0"][`File${i.toString().padStart(3, "0")}.txt`] = `Content of file ${i}`;
      }

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const paths = await store.getFilePaths("15.0.0");

      expect(paths).toHaveLength(100);
      expect(paths).toContain("File000.txt");
      expect(paths).toContain("File099.txt");

      const content = await store.getFile("15.0.0", "File050.txt");
      expect(content).toBe("Content of file 50");
    });
  });
});
