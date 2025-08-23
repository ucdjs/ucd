import { setupMockStore } from "#internal/test-utils/store";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { BridgeUnsupportedOperation, defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { flattenFilePaths } from "@ucdjs/shared";
import { createNodeUCDStore, UCDStore } from "@ucdjs/ucd-store";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";

describe("file operations", () => {
  beforeEach(() => {
    setupMockStore({
      baseUrl: UCDJS_API_BASE_URL,
      responses: {
        "/api/v1/versions": [...UNICODE_VERSION_METADATA],
      },
    });

    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("file tree", () => {
    it("should get file tree for valid version", async () => {
      const storePath = await testdir({
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
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      expect(store.initialized).toBe(true);
      expect(store.versions).toEqual(["15.0.0"]);

      const [fileTree, fileTreeError] = await store.getFileTree("15.0.0");
      assert(fileTreeError === null, "Failed to get file tree");
      assert(fileTree != null, "Expected file tree data to be non-null");

      expect(fileTree).toEqual([
        {
          name: "ArabicShaping.txt",
          path: "ArabicShaping.txt",
          type: "file",
        },
        {
          name: "BidiBrackets.txt",
          path: "BidiBrackets.txt",
          type: "file",
        },
        {
          children: [
            {
              name: "DerivedBidiClass.txt",
              path: "DerivedBidiClass.txt",
              type: "file",
            },
            {
              children: [
                {
                  name: "DeepFile.txt",
                  path: "DeepFile.txt",
                  type: "file",
                },
              ],
              name: "nested",
              path: "nested",
              type: "directory",
            },
          ],
          name: "extracted",
          path: "extracted",
          type: "directory",
        },
      ]);

      const flattenedTree = flattenFilePaths(fileTree);
      expect(flattenedTree).toEqual([
        "ArabicShaping.txt",
        "BidiBrackets.txt",
        "extracted/DerivedBidiClass.txt",
        "extracted/nested/DeepFile.txt",
      ]);
    });

    it("should throw error for invalid version", async () => {
      const storePath = await testdir({
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      expect(store.initialized).toBe(true);
      expect(store.versions).toEqual(["15.0.0"]);

      const [fileTreeData, fileTreeError] = await store.getFileTree("16.0.0");
      expect(fileTreeData).toBe(null);
      assert(fileTreeError != null, "Expected error for invalid version");
      expect(fileTreeError.message).toBe("Version '16.0.0' does not exist in the store.");
    });

    it("should handle empty file tree", async () => {
      const storePath = await testdir({
        "15.0.0": {},
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      expect(store.initialized).toBe(true);
      expect(store.versions).toEqual(["15.0.0"]);

      const [fileTree, fileTreeError] = await store.getFileTree("15.0.0");
      assert(fileTreeError === null, "Expected getFileTree to succeed");
      expect(fileTree).toEqual([]);
    });

    it("should allow filtering file tree", async () => {
      const storePath = await testdir({
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
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      expect(store.initialized).toBe(true);
      expect(store.versions).toEqual(["15.0.0"]);

      const [fileTree1, error1] = await store.getFileTree("15.0.0", ["!**/extracted"]);
      const [fileTree2, error2] = await store.getFileTree("15.0.0", ["!**/extracted/**"]);

      assert(error1 === null && error2 === null, "Expected getFileTree calls to succeed");

      expect(fileTree1).toMatchObject(fileTree2);
      expect(fileTree1).toEqual([
        {
          name: "ArabicShaping.txt",
          path: "ArabicShaping.txt",
          type: "file",
        },
        {
          name: "BidiBrackets.txt",
          path: "BidiBrackets.txt",
          type: "file",
        },
      ]);
    });

    it("should allow filtering nested directory", async () => {
      const storePath = await testdir({
        "15.0.0": {
          extracted: {
            "DerivedBidiClass.txt": "Derived bidi class data",
            "nested": {
              "DeepFile.txt": "Deep nested file",
            },
          },
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      expect(store.initialized).toBe(true);
      expect(store.versions).toEqual(["15.0.0"]);

      const [fileTree1, error1] = await store.getFileTree("15.0.0", ["!extracted/nested/**"]);
      const [fileTree2, error2] = await store.getFileTree("15.0.0", ["!**/DeepFile.txt"]);
      const [fileTree3, error3] = await store.getFileTree("15.0.0", ["!extracted/nested"]);
      const [fileTree4, error4] = await store.getFileTree("15.0.0", ["!extracted/nested/DeepFile.txt"]);

      assert(error1 === null && error2 === null && error3 === null && error4 === null, "Expected all getFileTree calls to succeed");

      expect(fileTree1).toEqual(fileTree2);
      expect(fileTree1).toEqual(fileTree3);
      expect(fileTree1).toEqual(fileTree4);

      expect(fileTree1).toEqual([
        {
          name: "extracted",
          path: "extracted",
          type: "directory",
          children: [
            {
              name: "DerivedBidiClass.txt",
              path: "DerivedBidiClass.txt",
              type: "file",
            },
          ],
        },
      ]);
    });

    it.each([
      {
        name: "include specific files",
        filters: ["**/ArabicShaping.txt"],
        expected: [
          {
            name: "ArabicShaping.txt",
            path: "ArabicShaping.txt",
            type: "file",
          },
        ],
      },
      {
        name: "include directory contents",
        filters: ["**/extracted/**"],
        expected: [
          {
            name: "extracted",
            path: "extracted",
            type: "directory",
            children: [
              {
                name: "DerivedBidiClass.txt",
                path: "DerivedBidiClass.txt",
                type: "file",
              },
              {
                name: "nested",
                path: "nested",
                type: "directory",
                children: [
                  {
                    name: "DeepFile.txt",
                    path: "DeepFile.txt",
                    type: "file",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "exclude then include specific pattern",
        filters: ["!**/extracted/**", "**/*.txt"],
        expected: [
          {
            name: "ArabicShaping.txt",
            path: "ArabicShaping.txt",
            type: "file",
          },
          {
            name: "BidiBrackets.txt",
            path: "BidiBrackets.txt",
            type: "file",
          },
        ],
      },
      {
        name: "multiple exclude patterns",
        filters: ["!**/ArabicShaping.txt", "!**/nested/**"],
        expected: [
          {
            name: "BidiBrackets.txt",
            path: "BidiBrackets.txt",
            type: "file",
          },
          {
            name: "extracted",
            path: "extracted",
            type: "directory",
            children: [
              {
                name: "DerivedBidiClass.txt",
                path: "DerivedBidiClass.txt",
                type: "file",
              },
            ],
          },
        ],
      },
    ])("should handle filters: $name", async ({ filters, expected }) => {
      const storePath = await testdir({
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
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const [fileTree, fileTreeError] = await store.getFileTree("15.0.0", filters);
      assert(fileTreeError === null, "Expected getFileTree to succeed");
      expect(fileTree).toEqual(expected);
    });

    it("should return empty array when all files are filtered out", async () => {
      const storePath = await testdir({
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const [fileTree, fileTreeError] = await store.getFileTree("15.0.0", ["!**/*"]);
      assert(fileTreeError === null, "Expected getFileTree to succeed");
      expect(fileTree).toEqual([]);
    });

    it("should handle only root-level files", async () => {
      const storePath = await testdir({
        "15.0.0": {
          "file1.txt": "content1",
          "file2.txt": "content2",
          "file3.txt": "content3",
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const [fileTree, fileTreeError] = await store.getFileTree("15.0.0");
      assert(fileTreeError === null, "Expected getFileTree to succeed");
      expect(fileTree).toEqual([
        {
          name: "file1.txt",
          path: "file1.txt",
          type: "file",
        },
        {
          name: "file2.txt",
          path: "file2.txt",
          type: "file",
        },
        {
          name: "file3.txt",
          path: "file3.txt",
          type: "file",
        },
      ]);
    });

    it("should handle empty directories correctly", async () => {
      const storePath = await testdir({
        "15.0.0": {
          "file.txt": "content",
          "emptyDir": {},
          "dirWithFilteredContent": {
            "filtered.txt": "this will be filtered",
          },
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const [fileTree, fileTreeError] = await store.getFileTree("15.0.0", ["!**/filtered.txt"]);
      assert(fileTreeError === null, "Expected getFileTree to succeed");
      expect(fileTree).toEqual([
        {
          children: [],
          name: "emptyDir",
          path: "emptyDir",
          type: "directory",
        },
        {
          name: "file.txt",
          path: "file.txt",
          type: "file",
        },
      ]);
    });
  });

  describe("file paths", () => {
    it("should get flattened file paths", async () => {
      const storePath = await testdir({
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
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const [filePaths, filePathsError] = await store.getFilePaths("15.0.0");
      assert(filePathsError === null, "Expected getFilePaths to succeed");
      expect(filePaths).toEqual([
        "ArabicShaping.txt",
        "BidiBrackets.txt",
        "extracted/DerivedBidiClass.txt",
        "extracted/nested/DeepFile.txt",
      ]);
    });

    it("should respect filters in getFilePaths", async () => {
      const storePath = await testdir({
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
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const [filePaths, filePathsError] = await store.getFilePaths("15.0.0", ["!**/nested/**"]);
      assert(filePathsError === null, "Expected getFilePaths to succeed");
      expect(filePaths).toEqual([
        "ArabicShaping.txt",
        "BidiBrackets.txt",
        "extracted/DerivedBidiClass.txt",
      ]);
    });

    it("should throw error for invalid version in getFilePaths", async () => {
      const storePath = await testdir({
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const [filePathsData, filePathsError] = await store.getFilePaths("16.0.0");
      expect(filePathsData).toBe(null);
      assert(filePathsError != null, "Expected error for invalid version");
      expect(filePathsError.message).toBe("Version '16.0.0' does not exist in the store.");
    });
  });

  describe("capability requirements", () => {
    it("should throw BridgeUnsupportedOperation when getFileTree is called without listdir capability", async () => {
      const readSpy = vi.fn().mockResolvedValueOnce(JSON.stringify({}));
      const writeSpy = vi.fn().mockResolvedValue(undefined);
      const existsSpy = vi.fn().mockResolvedValue(true);
      const mkdirSpy = vi.fn().mockResolvedValue(undefined);

      // create a bridge without listdir capability
      const bridgeWithoutListdir = defineFileSystemBridge({
        setup: () => ({
          read: readSpy,
          write: writeSpy,
          exists: existsSpy,
          mkdir: mkdirSpy,
          // no listdir capability
        }),
      });

      const store = new UCDStore({
        fs: bridgeWithoutListdir(),
        versions: ["15.0.0"],
      });

      await store.init();

      const [fileTreeData, fileTreeError] = await store.getFileTree("15.0.0");
      expect(fileTreeData).toBe(null);
      assert(fileTreeError != null, "Expected error for unsupported operation");
      expect(fileTreeError).toBeInstanceOf(BridgeUnsupportedOperation);
      expect(fileTreeError.message).toBe("File system bridge does not support the 'listdir' capability.");

      // verify that no other methods were called since listdir fails first
      expect(writeSpy).not.toHaveBeenCalled();
      expect(mkdirSpy).not.toHaveBeenCalled();
    });

    it("should throw BridgeUnsupportedOperation when getFilePaths is called without listdir capability", async () => {
      const readSpy = vi.fn().mockResolvedValueOnce(JSON.stringify({}));
      const writeSpy = vi.fn().mockResolvedValue(undefined);
      const existsSpy = vi.fn().mockResolvedValue(true);
      const mkdirSpy = vi.fn().mockResolvedValue(undefined);

      // create a bridge without listdir capability
      const bridgeWithoutListdir = defineFileSystemBridge({
        setup: () => ({
          read: readSpy,
          write: writeSpy,
          exists: existsSpy,
          mkdir: mkdirSpy,
          // no listdir capability
        }),
      });

      const store = new UCDStore({
        fs: bridgeWithoutListdir(),
        versions: ["15.0.0"],
      });

      await store.init();

      // getFilePaths internally calls getFileTree, so it should also fail
      const [filePathsData, filePathsError] = await store.getFilePaths("15.0.0");
      expect(filePathsData).toBe(null);
      assert(filePathsError != null, "Expected error for unsupported operation");
      expect(filePathsError).toBeInstanceOf(BridgeUnsupportedOperation);
      expect(filePathsError.message).toBe("File system bridge does not support the 'listdir' capability.");

      // verify that no other methods were called since listdir fails first
      expect(writeSpy).not.toHaveBeenCalled();
      expect(mkdirSpy).not.toHaveBeenCalled();
    });

    it("should work correctly when bridge has required capabilities", async () => {
      const readSpy = vi.fn().mockResolvedValueOnce(JSON.stringify({}));
      const writeSpy = vi.fn().mockResolvedValue(undefined);
      const existsSpy = vi.fn().mockResolvedValue(true);
      const mkdirSpy = vi.fn().mockResolvedValue(undefined);
      const listdirSpy = vi.fn().mockResolvedValue([
        {
          name: "test.txt",
          path: "test.txt",
          type: "file" as const,
        },
      ]);

      // create a bridge with all necessary capabilities
      const bridgeWithCapabilities = defineFileSystemBridge({
        setup: () => ({
          read: readSpy,
          write: writeSpy,
          exists: existsSpy,
          listdir: listdirSpy,
          mkdir: mkdirSpy,
        }),
      });

      const store = new UCDStore({
        fs: bridgeWithCapabilities(),
        versions: ["15.0.0"],
      });

      await store.init();

      // verify that read & exists has been called once for the init process
      expect(readSpy).toHaveBeenCalledTimes(1);
      expect(existsSpy).toHaveBeenCalledTimes(1);

      // these should not throw
      const [fileTreeData, fileTreeError] = await store.getFileTree("15.0.0");
      assert(fileTreeError === null, "Expected getFileTree to succeed");
      expect(fileTreeData).toEqual([
        {
          name: "test.txt",
          path: "test.txt",
          type: "file",
        },
      ]);

      const [filePathsData, filePathsError] = await store.getFilePaths("15.0.0");
      assert(filePathsError === null, "Expected getFilePaths to succeed");
      expect(filePathsData).toEqual(["test.txt"]);

      // verify that only listdir was called for these operations
      expect(listdirSpy).toHaveBeenCalledTimes(2); // once for getFileTree, once for getFilePaths
      expect(readSpy).not.toHaveBeenCalledAfter(listdirSpy);
      expect(existsSpy).not.toHaveBeenCalledAfter(listdirSpy);
      expect(writeSpy).not.toHaveBeenCalled();
      expect(mkdirSpy).not.toHaveBeenCalled();
    });
  });

  describe("get file", () => {
    it.each([
      {
        name: "relative path to root file",
        structure: { "file.txt": "File content" },
        path: "./file.txt",
        expected: "File content",
      },
      {
        name: "relative path to nested file",
        structure: { nested: { "file.txt": "Nested file content" } },
        path: "./nested/file.txt",
        expected: "Nested file content",
      },
    ])("should get file content using $name", async ({ structure, path, expected }) => {
      const storePath = await testdir({
        "15.0.0": structure,
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const [content, contentError] = await store.getFile("15.0.0", path);
      assert(contentError === null, "Expected getFile to succeed");
      expect(content).toBe(expected);
    });

    it("should be able to get file using full system path", async () => {
      const storePath = await testdir({
        "15.0.0": {
          "file.txt": "Full path content",
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const [content, contentError] = await store.getFile("15.0.0", `${storePath}/15.0.0/file.txt`);
      assert(contentError === null, "Expected getFile to succeed");
      expect(content).toBe("Full path content");
    });

    it("should throw error for invalid file", async () => {
      const storePath = await testdir({
        "15.0.0": {
          "file.txt": "File content",
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const [fileData, fileError] = await store.getFile("15.0.0", "./nonexistent.txt");
      expect(fileData).toBe(null);
      assert(fileError != null, "Expected error for nonexistent file");
      expect(fileError.message).toBe("File './nonexistent.txt' does not exist in version '15.0.0'.");
    });

    it("should disallow reading files outside the store", async () => {
      const storePath = await testdir({
        "15.0.0": {
          "file.txt": "Store file content",
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const [fileData, fileError] = await store.getFile("15.0.0", "../../outside.txt");
      expect(fileData).toBe(null);
      assert(fileError != null, "Expected error for path traversal");
      expect(fileError.message).toBe("Path traversal detected: ../outside.txt resolves outside base directory");
    });
  });
});
