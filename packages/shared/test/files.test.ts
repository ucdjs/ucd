import type { UnicodeFileTreeNode } from "@ucdjs/schemas";
import { describe, expect, it } from "vitest";
import { findFileByPath, flattenFilePaths } from "../src/files";

describe("findFileByPath", () => {
  it("should return undefined for empty input", () => {
    const result = findFileByPath([], "file.txt");
    expect(result).toBeUndefined();
  });

  it("should find a file at the root level", () => {
    const files: UnicodeFileTreeNode[] = [
      { type: "file", name: "file1.txt", path: "/file1.txt", lastModified: null },
      { type: "file", name: "file2.txt", path: "/file2.txt", lastModified: null },
    ];

    const result = findFileByPath(files, "/file1.txt");
    expect(result).toEqual({ type: "file", name: "file1.txt", path: "/file1.txt", lastModified: null });
  });

  it("should return undefined when file is not found", () => {
    const files: UnicodeFileTreeNode[] = [
      { type: "file", name: "file1.txt", path: "/file1.txt", lastModified: null },
    ];

    const result = findFileByPath(files, "/nonexistent.txt");
    expect(result).toBeUndefined();
  });

  it("should find a file in a nested directory", () => {
    const files: UnicodeFileTreeNode[] = [
      {
        type: "directory",
        name: "folder",
        path: "/folder/",
        children: [
          { type: "file", name: "nested.txt", path: "/folder/nested.txt", lastModified: null },
        ],
        lastModified: null,
      },
    ];

    const result = findFileByPath(files, "/folder/nested.txt");
    expect(result).toEqual({ type: "file", name: "nested.txt", path: "/folder/nested.txt", lastModified: null });
  });

  it("should find a file in deeply nested directories", () => {
    const files: UnicodeFileTreeNode[] = [
      {
        type: "directory",
        name: "level1",
        path: "/level1/",
        children: [
          {
            type: "directory",
            name: "level2",
            path: "/level1/level2/",
            children: [
              {
                type: "directory",
                name: "level3",
                path: "/level1/level2/level3/",
                children: [
                  { type: "file", name: "deep.txt", path: "/level1/level2/level3/deep.txt", lastModified: null },
                ],
                lastModified: null,
              },
            ],
            lastModified: null,
          },
        ],
        lastModified: null,
      },
    ];

    const result = findFileByPath(files, "/level1/level2/level3/deep.txt");
    expect(result).toEqual({ type: "file", name: "deep.txt", path: "/level1/level2/level3/deep.txt", lastModified: null });
  });

  it("should use path property when available", () => {
    const files: UnicodeFileTreeNode[] = [
      { type: "file", name: "file.txt", path: "/custom/path.txt", lastModified: null },
    ];

    const result = findFileByPath(files, "/custom/path.txt");
    expect(result).toEqual({ type: "file", name: "file.txt", path: "/custom/path.txt", lastModified: null });
  });

  it("should not match when search path lacks leading slash", () => {
    const files: UnicodeFileTreeNode[] = [
      { type: "file", name: "file.txt", path: "/file.txt", lastModified: null },
    ];

    const result = findFileByPath(files, "file.txt");
    expect(result).toBeUndefined();
  });

  it("should not match nested path when search path lacks leading slash", () => {
    const files: UnicodeFileTreeNode[] = [
      {
        type: "directory",
        name: "folder",
        path: "/folder/",
        lastModified: null,
        children: [
          { type: "file", name: "nested.txt", path: "/folder/nested.txt", lastModified: null },
        ],
      },
    ];

    const result = findFileByPath(files, "folder/nested.txt");
    expect(result).not.toEqual({ type: "file", name: "nested.txt", path: "/folder/nested.txt", lastModified: null });
    expect(result).toBeUndefined();
  });

  it("should preserve custom properties on the returned node", () => {
    type CustomNode = UnicodeFileTreeNode & {
      _content?: string;
    };

    const files: CustomNode[] = [
      { type: "file", name: "file.txt", path: "/file.txt", lastModified: null, _content: "Hello, World!" },
    ];

    const result = findFileByPath(files, "/file.txt");
    expect(result).toEqual({ type: "file", name: "file.txt", path: "/file.txt", lastModified: null, _content: "Hello, World!" });
    expect(result?._content).toBe("Hello, World!");
  });

  it("should match directories with trailing slash", () => {
    const files: UnicodeFileTreeNode[] = [
      {
        type: "directory",
        name: "folder",
        path: "/folder/",
        lastModified: null,
        children: [
          { type: "file", name: "file.txt", path: "/folder/file.txt", lastModified: null },
        ],
      },
    ];

    // Searching for just the directory name should match the directory
    const result = findFileByPath(files, "/folder/");
    expect(result).toEqual({
      type: "directory",
      name: "folder",
      path: "/folder/",
      lastModified: null,
      children: [{
        type: "file",
        name: "file.txt",
        path: "/folder/file.txt",
        lastModified: null,
      }],
    });
  });

  it("should handle mixed files and directories", () => {
    const files: UnicodeFileTreeNode[] = [
      { type: "file", name: "root.txt", path: "/root.txt", lastModified: null },
      {
        type: "directory",
        name: "docs",
        path: "/docs/",
        lastModified: null,
        children: [
          { type: "file", name: "readme.md", path: "/docs/readme.md", lastModified: null },
          {
            type: "directory",
            name: "api",
            path: "/docs/api/",
            lastModified: null,
            children: [
              { type: "file", name: "index.html", path: "/docs/api/index.html", lastModified: null },
            ],
          },
        ],
      },
      { type: "file", name: "package.json", path: "/package.json", lastModified: null },
    ];

    expect(findFileByPath(files, "/root.txt")).toEqual({ type: "file", name: "root.txt", path: "/root.txt", lastModified: null });
    expect(findFileByPath(files, "/docs/readme.md")).toEqual({ type: "file", name: "readme.md", path: "/docs/readme.md", lastModified: null });
    expect(findFileByPath(files, "/docs/api/index.html")).toEqual({ type: "file", name: "index.html", path: "/docs/api/index.html", lastModified: null });
    expect(findFileByPath(files, "/package.json")).toEqual({ type: "file", name: "package.json", path: "/package.json", lastModified: null });
  });

  it("should handle empty directories", () => {
    const files: UnicodeFileTreeNode[] = [
      {
        type: "directory",
        name: "empty",
        path: "/empty/",
        lastModified: null,
        children: [],
      },
      { type: "file", name: "file.txt", path: "/file.txt", lastModified: null },
    ];

    const result = findFileByPath(files, "/file.txt");
    expect(result).toEqual({ type: "file", name: "file.txt", path: "/file.txt", lastModified: null });
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
        path: "/file1.txt",
      },
      {
        type: "file",
        name: "file2.txt",
        path: "/file2.txt",
      },
    ]);

    expect(result).toEqual(["/file1.txt", "/file2.txt"]);
  });

  it("should handle folders with children", () => {
    const result = flattenFilePaths([
      {
        name: "folder1",
        path: "/folder1/",
        type: "directory",
        lastModified: null,
        children: [
          { type: "file", name: "file1.txt", path: "/folder1/file1.txt", lastModified: null },
          { type: "file", name: "file2.txt", path: "/folder1/file2.txt", lastModified: null },
        ],
      },
    ]);

    expect(result).toEqual(["/folder1/file1.txt", "/folder1/file2.txt"]);
  });

  it("should handle mixed files and folders", () => {
    const result = flattenFilePaths([
      {
        type: "file",
        name: "root-file.txt",
        path: "/root-file.txt",
        lastModified: null,
      },
      {
        type: "directory",
        name: "folder1",
        path: "/folder1/",
        lastModified: null,
        children: [
          { type: "file", name: "nested-file.txt", path: "/folder1/nested-file.txt", lastModified: null },
        ],
      },
      { type: "file", name: "another-root-file.txt", path: "/another-root-file.txt", lastModified: null },
    ]);

    expect(result).toEqual([
      "/root-file.txt",
      "/folder1/nested-file.txt",
      "/another-root-file.txt",
    ]);
  });

  it("should handle deeply nested structures", () => {
    const result = flattenFilePaths([
      {
        type: "directory",
        name: "level1",
        path: "/level1/",
        lastModified: null,
        children: [
          {
            type: "directory",
            name: "level2",
            path: "/level1/level2/",
            lastModified: null,
            children: [
              {
                type: "directory",
                name: "level3",
                path: "/level1/level2/level3/",
                lastModified: null,
                children: [
                  {
                    type: "file",
                    name: "deep-file.txt",
                    path: "/level1/level2/level3/deep-file.txt",
                    lastModified: null,
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);

    expect(result).toEqual(["/level1/level2/level3/deep-file.txt"]);
  });

  it("should handle prefix parameter", () => {
    const result = flattenFilePaths([
      {
        type: "file",
        name: "file.txt",
        path: "/file.txt",
        lastModified: null,
      },
      {
        type: "directory",
        name: "folder",
        path: "/folder/",
        lastModified: null,
        children: [
          { type: "file", name: "nested.txt", path: "/folder/nested.txt", lastModified: null },
        ],
      },
    ], "");

    expect(result).toEqual(["/file.txt", "/folder/nested.txt"]);
  });

  it("should handle empty prefix", () => {
    const result = flattenFilePaths([
      {
        type: "file",
        name: "file.txt",
        path: "/file.txt",
        lastModified: null,
      },
    ], "");

    expect(result).toEqual(["/file.txt"]);
  });

  it("should handle folders with empty children arrays", () => {
    const result = flattenFilePaths([
      {
        type: "directory",
        name: "empty-folder",
        path: "/empty-folder/",
        lastModified: null,
        children: [],
      },
      {
        type: "file",
        name: "file.txt",
        path: "/file.txt",
        lastModified: null,
      },
    ]);

    expect(result).toEqual(["/file.txt"]);
  });

  it("should handle complex nested structure with multiple levels", () => {
    const result = flattenFilePaths([
      {
        type: "directory",
        name: "docs",
        path: "/docs/",
        lastModified: null,
        children: [
          { type: "file", name: "readme.md", path: "/docs/readme.md", lastModified: null },
          {
            type: "directory",
            name: "api",
            path: "/docs/api/",
            lastModified: null,
            children: [
              { type: "file", name: "index.html", path: "/docs/api/index.html", lastModified: null },
              { type: "file", name: "methods.html", path: "/docs/api/methods.html", lastModified: null },
            ],
          },
        ],
      },
      {
        type: "directory",
        name: "src",
        path: "/src/",
        lastModified: null,
        children: [
          { type: "file", name: "index.ts", path: "/src/index.ts", lastModified: null },
          {
            type: "directory",
            name: "utils",
            path: "/src/utils/",
            lastModified: null,
            children: [
              { type: "file", name: "helpers.ts", path: "/src/utils/helpers.ts", lastModified: null },
            ],
          },
        ],
      },
      { type: "file", name: "package.json", path: "/package.json", lastModified: null },
    ]);

    expect(result).toEqual([
      "/docs/readme.md",
      "/docs/api/index.html",
      "/docs/api/methods.html",
      "/src/index.ts",
      "/src/utils/helpers.ts",
      "/package.json",
    ]);
  });

  it("should handle paths with leading slashes", () => {
    const result = flattenFilePaths([
      {
        type: "file",
        name: "file1.txt",
        path: "/file1.txt",
      },
      {
        type: "directory",
        name: "folder",
        path: "/folder/",
        lastModified: null,
        children: [
          { type: "file", name: "nested.txt", path: "/folder/nested.txt", lastModified: null },
        ],
      },
    ]);

    expect(result).toEqual(["/file1.txt", "/folder/nested.txt"]);
  });
});
