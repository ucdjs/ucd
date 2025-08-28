import type { UnicodeTree } from "@ucdjs/fetch";
import { describe, expect, it } from "vitest";
import { flattenFilePaths } from "../src/flatten";

describe("flattenFilePaths", () => {
  it("should return empty array for empty input", () => {
    const result = flattenFilePaths([]);
    expect(result).toEqual([]);
  });

  it("should handle files without children", () => {
    const files: UnicodeTree = [
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
    ];
    const result = flattenFilePaths(files);
    expect(result).toEqual(["file1.txt", "file2.txt"]);
  });

  it("should handle folders with children", () => {
    const files: UnicodeTree = [
      {
        name: "folder1",
        path: "folder1",
        type: "directory",
        children: [
          { type: "file", name: "file1.txt", path: "file1.txt" },
          { type: "file", name: "file2.txt", path: "file2.txt" },
        ],
      },
    ];

    const result = flattenFilePaths(files);
    expect(result).toEqual(["folder1/file1.txt", "folder1/file2.txt"]);
  });

  it("should handle mixed files and folders", () => {
    const files: UnicodeTree = [
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
          { type: "file", name: "nested-file.txt", path: "nested-file.txt" },
        ],
      },
      { type: "file", name: "another-root-file.txt", path: "another-root-file.txt" },
    ];

    const result = flattenFilePaths(files);
    expect(result).toEqual([
      "root-file.txt",
      "folder1/nested-file.txt",
      "another-root-file.txt",
    ]);
  });

  it("should handle deeply nested structures", () => {
    const files: UnicodeTree = [
      {
        type: "directory",
        name: "level1",
        path: "level1",
        children: [
          {
            type: "directory",
            name: "level2",
            path: "level2",
            children: [
              {
                type: "directory",
                name: "level3",
                path: "level3",
                children: [
                  {
                    type: "file",
                    name: "deep-file.txt",
                    path: "deep-file.txt",
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const result = flattenFilePaths(files);
    expect(result).toEqual(["level1/level2/level3/deep-file.txt"]);
  });

  it("should handle prefix parameter", () => {
    const files: UnicodeTree = [
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
          { type: "file", name: "nested.txt", path: "nested.txt" },
        ],
      },
    ];

    const result = flattenFilePaths(files, "prefix");
    expect(result).toEqual(["prefix/file.txt", "prefix/folder/nested.txt"]);
  });

  it("should handle empty prefix", () => {
    const files: UnicodeTree = [
      {
        type: "file",
        name: "file.txt",
        path: "file.txt",
      },
    ];

    const result = flattenFilePaths(files, "");
    expect(result).toEqual(["file.txt"]);
  });

  it("should handle folders with empty children arrays", () => {
    const files: UnicodeTree = [
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
    ];

    const result = flattenFilePaths(files);
    expect(result).toEqual(["file.txt"]);
  });

  it("should handle complex nested structure with multiple levels", () => {
    const files: UnicodeTree = [
      {
        type: "directory",
        name: "docs",
        path: "docs",
        children: [
          { type: "file", name: "readme.md", path: "readme.md" },
          {
            type: "directory",
            name: "api",
            path: "api",
            children: [
              { type: "file", name: "index.html", path: "index.html" },
              { type: "file", name: "methods.html", path: "methods.html" },
            ],
          },
        ],
      },
      {
        type: "directory",
        name: "src",
        path: "src",
        children: [
          { type: "file", name: "index.ts", path: "index.ts" },
          {
            type: "directory",
            name: "utils",
            path: "utils",
            children: [
              { type: "file", name: "helpers.ts", path: "helpers.ts" },
            ],
          },
        ],
      },
      { type: "file", name: "package.json", path: "package.json" },
    ];

    const result = flattenFilePaths(files);
    expect(result).toEqual([
      "docs/readme.md",
      "docs/api/index.html",
      "docs/api/methods.html",
      "src/index.ts",
      "src/utils/helpers.ts",
      "package.json",
    ]);
  });

  it("should handle directory paths when includeDirectories is true", () => {
    const files: UnicodeTree = [
      {
        type: "directory",
        name: "folder1",
        path: "folder1",
        children: [
          { type: "file", name: "file1.txt", path: "file1.txt" },
        ],
      },
      {
        type: "file",
        name: "file2.txt",
        path: "file2.txt",
      },
    ];

    const result = flattenFilePaths(files, "", { includeDirectories: true });
    expect(result).toEqual([
      "folder1",
      "folder1/file1.txt",
      "file2.txt",
    ]);
  });

  it("should not include directory paths when includeDirectories is false", () => {
    const files: UnicodeTree = [
      {
        type: "directory",
        name: "folder1",
        path: "folder1",
        children: [
          { type: "file", name: "file1.txt", path: "file1.txt" },
        ],
      },
      {
        type: "file",
        name: "file2.txt",
        path: "file2.txt",
      },
    ];

    const result = flattenFilePaths(files, "", { includeDirectories: false });
    expect(result).toEqual([
      "folder1/file1.txt",
      "file2.txt",
    ]);
  });

  it("should throw TypeError for invalid input", () => {
    expect(() => flattenFilePaths(null as unknown as UnicodeTree)).toThrow(TypeError);
    expect(() => flattenFilePaths(undefined as unknown as UnicodeTree)).toThrow(TypeError);
    expect(() => flattenFilePaths({} as unknown as UnicodeTree)).toThrow(TypeError);
    expect(() => flattenFilePaths("invalid" as unknown as UnicodeTree)).toThrow(TypeError);
  });
});
