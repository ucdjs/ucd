import type { TreeNode } from "../src/files";
import { describe, expect, it } from "vitest";
import { findFileByPath, flattenFilePaths } from "../src/files";

describe("findFileByPath", () => {
  it("should return undefined for empty input", () => {
    const result = findFileByPath([], "file.txt");
    expect(result).toBeUndefined();
  });

  it("should find a file at the root level", () => {
    const files: TreeNode[] = [
      { type: "file", name: "file1.txt" },
      { type: "file", name: "file2.txt" },
    ];

    const result = findFileByPath(files, "file1.txt");
    expect(result).toEqual({ type: "file", name: "file1.txt" });
  });

  it("should return undefined when file is not found", () => {
    const files: TreeNode[] = [
      { type: "file", name: "file1.txt" },
    ];

    const result = findFileByPath(files, "nonexistent.txt");
    expect(result).toBeUndefined();
  });

  it("should find a file in a nested directory", () => {
    const files: TreeNode[] = [
      {
        type: "directory",
        name: "folder",
        path: "folder",
        children: [
          { type: "file", name: "nested.txt", path: "folder/nested.txt" },
        ],
      },
    ];

    const result = findFileByPath(files, "folder/nested.txt");
    expect(result).toEqual({ type: "file", name: "nested.txt", path: "folder/nested.txt" });
  });

  it("should find a file in deeply nested directories", () => {
    const files: TreeNode[] = [
      {
        type: "directory",
        name: "level1",
        path: "level1",
        children: [
          {
            type: "directory",
            name: "level2",
            path: "level1/level2",
            children: [
              {
                type: "directory",
                name: "level3",
                path: "level1/level2/level3",
                children: [
                  { type: "file", name: "deep.txt", path: "level1/level2/level3/deep.txt" },
                ],
              },
            ],
          },
        ],
      },
    ];

    const result = findFileByPath(files, "level1/level2/level3/deep.txt");
    expect(result).toEqual({ type: "file", name: "deep.txt", path: "level1/level2/level3/deep.txt" });
  });

  it("should use path property when available", () => {
    const files: TreeNode[] = [
      { type: "file", name: "file.txt", path: "custom/path.txt" },
    ];

    const result = findFileByPath(files, "custom/path.txt");
    expect(result).toEqual({ type: "file", name: "file.txt", path: "custom/path.txt" });
  });

  it("should not match path with leading slash", () => {
    const files: TreeNode[] = [
      { type: "file", name: "file.txt" },
    ];

    const result = findFileByPath(files, "/file.txt");
    expect(result).not.toEqual({ type: "file", name: "file.txt" });
    expect(result).toBeUndefined();
  });

  it("should not match nested path with leading slash", () => {
    const files: TreeNode[] = [
      {
        type: "directory",
        name: "folder",
        path: "folder",
        children: [
          { type: "file", name: "nested.txt", path: "folder/nested.txt" },
        ],
      },
    ];

    const result = findFileByPath(files, "/folder/nested.txt");
    expect(result).not.toEqual({ type: "file", name: "nested.txt", path: "folder/nested.txt" });
    expect(result).toBeUndefined();
  });

  it("should preserve custom properties on the returned node", () => {
    interface CustomNode extends TreeNode {
      _content?: string;
    }

    const files: CustomNode[] = [
      { type: "file", name: "file.txt", _content: "Hello, World!" },
    ];

    const result = findFileByPath(files, "file.txt");
    expect(result).toEqual({ type: "file", name: "file.txt", _content: "Hello, World!" });
    expect(result?._content).toBe("Hello, World!");
  });

  it("should match directories themselves", () => {
    const files: TreeNode[] = [
      {
        type: "directory",
        name: "folder",
        path: "folder",
        children: [
          { type: "file", name: "file.txt", path: "folder/file.txt" },
        ],
      },
    ];

    // Searching for just the directory name should match the directory
    const result = findFileByPath(files, "folder");
    expect(result).toEqual({
      type: "directory",
      name: "folder",
      path: "folder",
      children: [{
        type: "file",
        name: "file.txt",
        path: "folder/file.txt",
      }],
    });
  });

  it("should handle mixed files and directories", () => {
    const files: TreeNode[] = [
      { type: "file", name: "root.txt", path: "root.txt" },
      {
        type: "directory",
        name: "docs",
        path: "docs",
        children: [
          { type: "file", name: "readme.md", path: "docs/readme.md" },
          {
            type: "directory",
            name: "api",
            path: "docs/api",
            children: [
              { type: "file", name: "index.html", path: "docs/api/index.html" },
            ],
          },
        ],
      },
      { type: "file", name: "package.json", path: "package.json" },
    ];

    expect(findFileByPath(files, "root.txt")).toEqual({ type: "file", name: "root.txt", path: "root.txt" });
    expect(findFileByPath(files, "docs/readme.md")).toEqual({ type: "file", name: "readme.md", path: "docs/readme.md" });
    expect(findFileByPath(files, "docs/api/index.html")).toEqual({ type: "file", name: "index.html", path: "docs/api/index.html" });
    expect(findFileByPath(files, "package.json")).toEqual({ type: "file", name: "package.json", path: "package.json" });
  });

  it("should handle empty directories", () => {
    const files: TreeNode[] = [
      {
        type: "directory",
        name: "empty",
        path: "empty",
        children: [],
      },
      { type: "file", name: "file.txt", path: "file.txt" },
    ];

    const result = findFileByPath(files, "file.txt");
    expect(result).toEqual({ type: "file", name: "file.txt", path: "file.txt" });
  });
});

describe("flattenFilePaths", () => {
  it("should return empty array for empty input", () => {
    const result = flattenFilePaths([]);
    expect(result).toEqual([]);
  });

  it("should handle files without children", () => {
    const result = flattenFilePaths([
      {
        type: "file",
        name: "file1.txt",
        path: "file1.txt",
      },
      {
        type: "file",
        name: "file2.txt",
        path: "file2.txt",
      },
    ]);

    expect(result).toEqual(["file1.txt", "file2.txt"]);
  });

  it("should handle folders with children", () => {
    const result = flattenFilePaths([
      {
        name: "folder1",
        path: "folder1",
        type: "directory",
        children: [
          { type: "file", name: "file1.txt", path: "folder1/file1.txt" },
          { type: "file", name: "file2.txt", path: "folder1/file2.txt" },
        ],
      },
    ]);

    expect(result).toEqual(["folder1/file1.txt", "folder1/file2.txt"]);
  });

  it("should handle mixed files and folders", () => {
    const result = flattenFilePaths([
      {
        type: "file",
        name: "root-file.txt",
        path: "root-file.txt",
      },
      {
        type: "directory",
        name: "folder1",
        path: "folder1",
        children: [
          { type: "file", name: "nested-file.txt", path: "folder1/nested-file.txt" },
        ],
      },
      { type: "file", name: "another-root-file.txt", path: "another-root-file.txt" },
    ]);

    expect(result).toEqual([
      "root-file.txt",
      "folder1/nested-file.txt",
      "another-root-file.txt",
    ]);
  });

  it("should handle deeply nested structures", () => {
    const result = flattenFilePaths([
      {
        type: "directory",
        name: "level1",
        path: "level1",
        children: [
          {
            type: "directory",
            name: "level2",
            path: "level1/level2",
            children: [
              {
                type: "directory",
                name: "level3",
                path: "level1/level2/level3",
                children: [
                  {
                    type: "file",
                    name: "deep-file.txt",
                    path: "level1/level2/level3/deep-file.txt",
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);

    expect(result).toEqual(["level1/level2/level3/deep-file.txt"]);
  });

  it("should handle prefix parameter", () => {
    const result = flattenFilePaths([
      {
        type: "file",
        name: "file.txt",
        path: "file.txt",
      },
      {
        type: "directory",
        name: "folder",
        path: "folder",
        children: [
          { type: "file", name: "nested.txt", path: "folder/nested.txt" },
        ],
      },
    ], "prefix");

    expect(result).toEqual(["prefix/file.txt", "prefix/folder/nested.txt"]);
  });

  it("should handle empty prefix", () => {
    const result = flattenFilePaths([
      {
        type: "file",
        name: "file.txt",
        path: "file.txt",
      },
    ], "");

    expect(result).toEqual(["file.txt"]);
  });

  it("should handle folders with empty children arrays", () => {
    const result = flattenFilePaths([
      {
        type: "directory",
        name: "empty-folder",
        path: "empty-folder",
        children: [],
      },
      {
        type: "file",
        name: "file.txt",
        path: "file.txt",
      },
    ]);

    expect(result).toEqual(["file.txt"]);
  });

  it("should handle complex nested structure with multiple levels", () => {
    const result = flattenFilePaths([
      {
        type: "directory",
        name: "docs",
        path: "docs",
        children: [
          { type: "file", name: "readme.md", path: "docs/readme.md" },
          {
            type: "directory",
            name: "api",
            path: "docs/api",
            children: [
              { type: "file", name: "index.html", path: "docs/api/index.html" },
              { type: "file", name: "methods.html", path: "docs/api/methods.html" },
            ],
          },
        ],
      },
      {
        type: "directory",
        name: "src",
        path: "src",
        children: [
          { type: "file", name: "index.ts", path: "src/index.ts" },
          {
            type: "directory",
            name: "utils",
            path: "utils",
            children: [
              { type: "file", name: "helpers.ts", path: "src/utils/helpers.ts" },
            ],
          },
        ],
      },
      { type: "file", name: "package.json", path: "package.json" },
    ]);

    expect(result).toEqual([
      "docs/readme.md",
      "docs/api/index.html",
      "docs/api/methods.html",
      "src/index.ts",
      "src/utils/helpers.ts",
      "package.json",
    ]);
  });
});
