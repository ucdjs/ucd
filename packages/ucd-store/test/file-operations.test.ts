import { HttpResponse, mockFetch } from "#msw-utils";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createNodeUCDStore } from "@ucdjs/ucd-store";
import { flattenFilePaths } from "@ucdjs/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";

describe("file operations", () => {
  beforeEach(() => {
    mockFetch([
      [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(UNICODE_VERSION_METADATA);
      }],
    ]);

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
          "15.0.0": "15.0.0/",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      expect(store.initialized).toBe(true);
      expect(store.versions).toEqual(["15.0.0"]);

      const fileTree = await store.getFileTree("15.0.0");

      expect(fileTree).toEqual([
        {
          name: "ArabicShaping.txt",
          path: "/ArabicShaping.txt",
          type: "file",
        },
        {
          name: "BidiBrackets.txt",
          path: "/BidiBrackets.txt",
          type: "file",
        },
        {
          children: [
            {
              name: "DerivedBidiClass.txt",
              path: "/DerivedBidiClass.txt",
              type: "file",
            },
            {
              children: [
                {
                  name: "DeepFile.txt",
                  path: "/DeepFile.txt",
                  type: "file",
                },
              ],
              name: "nested",
              path: "/nested",
              type: "directory",
            },
          ],
          name: "extracted",
          path: "/extracted",
          type: "directory",
        },
      ]);

      const flattenedTree = flattenFilePaths(fileTree);
      expect(flattenedTree).toEqual([
        "/ArabicShaping.txt",
        "/BidiBrackets.txt",
        "/extracted/DerivedBidiClass.txt",
        "/extracted/nested/DeepFile.txt",
      ]);
    });

    it("should throw error for invalid version", async () => {
      const storePath = await testdir({
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0/",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      expect(store.initialized).toBe(true);
      expect(store.versions).toEqual(["15.0.0"]);

      await expect(store.getFileTree("16.0.0")).rejects.toThrow(
        "Version '16.0.0' does not exist in the store.",
      );
    });

    it("should handle empty file tree", async () => {
      const storePath = await testdir({
        "15.0.0": {},
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0/",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      expect(store.initialized).toBe(true);
      expect(store.versions).toEqual(["15.0.0"]);

      const fileTree = await store.getFileTree("15.0.0");
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
          "15.0.0": "15.0.0/",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      expect(store.initialized).toBe(true);
      expect(store.versions).toEqual(["15.0.0"]);

      const fileTree1 = await store.getFileTree("15.0.0", ["!**/extracted"]);
      const fileTree2 = await store.getFileTree("15.0.0", ["!**/extracted/**"]);

      expect(fileTree1).toMatchObject(fileTree2);
      expect(fileTree1).toEqual([
        {
          name: "ArabicShaping.txt",
          path: "/ArabicShaping.txt",
          type: "file",
        },
        {
          name: "BidiBrackets.txt",
          path: "/BidiBrackets.txt",
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
          "15.0.0": "15.0.0/",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      expect(store.initialized).toBe(true);
      expect(store.versions).toEqual(["15.0.0"]);

      const fileTree1 = await store.getFileTree("15.0.0", ["!**/extracted/nested/**"]);
      const fileTree2 = await store.getFileTree("15.0.0", ["!**/DeepFile.txt"]);
      const fileTree3 = await store.getFileTree("15.0.0", ["!**/extracted/nested"]);
      const fileTree4 = await store.getFileTree("15.0.0", ["!**/extracted/nested/DeepFile.txt"]);

      expect(fileTree1).toEqual(fileTree2);
      expect(fileTree1).toEqual(fileTree3);
      expect(fileTree1).toEqual(fileTree4);

      expect(fileTree1).toEqual([
        {
          name: "extracted",
          path: "/extracted",
          type: "directory",
          children: [
            {
              name: "DerivedBidiClass.txt",
              path: "/DerivedBidiClass.txt",
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
            path: "/ArabicShaping.txt",
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
            path: "/extracted",
            type: "directory",
            children: [
              {
                name: "DerivedBidiClass.txt",
                path: "/DerivedBidiClass.txt",
                type: "file",
              },
              {
                name: "nested",
                path: "/nested",
                type: "directory",
                children: [
                  {
                    name: "DeepFile.txt",
                    path: "/DeepFile.txt",
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
            path: "/ArabicShaping.txt",
            type: "file",
          },
          {
            name: "BidiBrackets.txt",
            path: "/BidiBrackets.txt",
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
            path: "/BidiBrackets.txt",
            type: "file",
          },
          {
            name: "extracted",
            path: "/extracted",
            type: "directory",
            children: [
              {
                name: "DerivedBidiClass.txt",
                path: "/DerivedBidiClass.txt",
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
          "15.0.0": "15.0.0/",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const fileTree = await store.getFileTree("15.0.0", filters);
      expect(fileTree).toEqual(expected);
    });

    it("should return empty array when all files are filtered out", async () => {
      const storePath = await testdir({
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0/",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const fileTree = await store.getFileTree("15.0.0", ["!**/*"]);
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
          "15.0.0": "15.0.0/",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const fileTree = await store.getFileTree("15.0.0");
      expect(fileTree).toEqual([
        {
          name: "file1.txt",
          path: "/file1.txt",
          type: "file",
        },
        {
          name: "file2.txt",
          path: "/file2.txt",
          type: "file",
        },
        {
          name: "file3.txt",
          path: "/file3.txt",
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
          "15.0.0": "15.0.0/",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const fileTree = await store.getFileTree("15.0.0", ["!**/filtered.txt"]);
      expect(fileTree).toEqual([
        {
          children: [],
          name: "emptyDir",
          path: "/emptyDir",
          type: "directory",
        },
        {
          name: "file.txt",
          path: "/file.txt",
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
          "15.0.0": "15.0.0/",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const filePaths = await store.getFilePaths("15.0.0");
      expect(filePaths).toEqual([
        "/ArabicShaping.txt",
        "/BidiBrackets.txt",
        "/extracted/DerivedBidiClass.txt",
        "/extracted/nested/DeepFile.txt",
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
          "15.0.0": "15.0.0/",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      const filePaths = await store.getFilePaths("15.0.0", ["!**/nested/**"]);
      expect(filePaths).toEqual([
        "/ArabicShaping.txt",
        "/BidiBrackets.txt",
        "/extracted/DerivedBidiClass.txt",
      ]);
    });

    it("should throw error for invalid version in getFilePaths", async () => {
      const storePath = await testdir({
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0/",
        }),
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
      });

      await store.init();
      await expect(store.getFilePaths("16.0.0")).rejects.toThrow(
        "Version '16.0.0' does not exist in the store.",
      );
    });
  });
});
