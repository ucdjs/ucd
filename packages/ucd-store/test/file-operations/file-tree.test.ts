import { mockStoreApi } from "#internal/test-utils/mock-store";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { flattenFilePaths } from "@ucdjs/shared";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createNodeUCDStore } from "../../src/factory";

describe("file tree", () => {
  beforeEach(() => {
    mockStoreApi({
      baseUrl: UCDJS_API_BASE_URL,
      responses: {
        "/api/v1/versions": [...UNICODE_VERSION_METADATA],
      },
    });

    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

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

    const [fileTree1, error1] = await store.getFileTree("15.0.0", {
      exclude: ["**/extracted"],
    });
    const [fileTree2, error2] = await store.getFileTree("15.0.0", {
      exclude: ["**/extracted/**"],
    });

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

    const [fileTree1, error1] = await store.getFileTree("15.0.0", {
      exclude: ["extracted/nested/**"],
    });
    const [fileTree2, error2] = await store.getFileTree("15.0.0", {
      exclude: ["**/DeepFile.txt"],
    });
    const [fileTree3, error3] = await store.getFileTree("15.0.0", {
      exclude: ["extracted/nested/DeepFile.txt"],
    });

    assert(error1 === null && error2 === null && error3 === null, "Expected all getFileTree calls to succeed");

    const expectedWithFilteredNested = [
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
    ];

    const expectedWithEmptyNested = [
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
            children: [],
          },
        ],
      },
    ];

    expect.soft(fileTree1).toEqual(expectedWithFilteredNested);
    expect.soft(fileTree2).toEqual(expectedWithEmptyNested);
    expect.soft(fileTree3).toEqual(expectedWithEmptyNested);
  });

  it.each([
    {
      name: "include specific files",
      filters: {
        include: ["**/ArabicShaping.txt"],
      },
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
      filters: {
        include: ["**/extracted/**"],
      },
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
      filters: {
        exclude: ["**/extracted/**"],
        include: ["**/*.txt"],
      },
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
      filters: {
        exclude: ["**/ArabicShaping.txt", "**/nested/**"],
      },
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
    const [fileTree, fileTreeError] = await store.getFileTree("15.0.0", {
      exclude: ["**/*"],
    });
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
    const [fileTree, fileTreeError] = await store.getFileTree("15.0.0", {
      exclude: ["**/filtered.txt"],
    });
    assert(fileTreeError === null, "Expected getFileTree to succeed");
    expect(fileTree).toEqual([
      {
        children: [],
        name: "dirWithFilteredContent",
        path: "dirWithFilteredContent",
        type: "directory",
      },
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

  it.todo("should include directories that don't match filter but contain matching children (GitHub Issue #215)", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "root-file.txt": "root content",
        "nonMatching": {
          "matching.txt": "should be included",
          "also-matching.txt": "should also be included",
          "nested": {
            "deep-matching.txt": "should be included too",
            "non-matching.log": "should be excluded",
          },
        },
        "alsoNonMatching": {
          "exclude.log": "should be excluded",
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
    const [fileTree, fileTreeError] = await store.getFileTree("15.0.0", {
      include: ["**/*.txt"],
    });
    assert(fileTreeError === null, "Expected getFileTree to succeed");

    const expected = [
      {
        name: "root-file.txt",
        path: "root-file.txt",
        type: "file",
      },
      {
        name: "nonMatching",
        path: "nonMatching",
        type: "directory",
        children: [
          {
            name: "also-matching.txt",
            path: "also-matching.txt",
            type: "file",
          },
          {
            name: "matching.txt",
            path: "matching.txt",
            type: "file",
          },
          {
            name: "nested",
            path: "nested",
            type: "directory",
            children: [
              {
                name: "deep-matching.txt",
                path: "deep-matching.txt",
                type: "file",
              },
            ],
          },
        ],
      },
    ];

    expect(fileTree).toEqual(expected);
  });
});
