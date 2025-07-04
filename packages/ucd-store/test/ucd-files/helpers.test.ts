import type { UnicodeVersionFile } from "@ucdjs/fetch";
import { describe, expect, it } from "vitest";
import { flattenFilePaths } from "../../src/ucd-files/helpers";

describe("flattenFilePaths", () => {
  it("should return empty array for empty input", () => {
    const result = flattenFilePaths([]);
    expect(result).toEqual([]);
  });

  it("should handle files without children", () => {
    const files: UnicodeVersionFile[] = [
      { name: "file1.txt", path: "" },
      { name: "file2.txt", path: "" },
    ];
    const result = flattenFilePaths(files);
    expect(result).toEqual(["file1.txt", "file2.txt"]);
  });

  it("should handle folders with children", () => {
    const files: UnicodeVersionFile[] = [
      {
        name: "folder1",
        path: "folder1",
        children: [
          { name: "file1.txt", path: "folder1/file1.txt" },
          { name: "file2.txt", path: "folder1/file2.txt" },
        ],
      },
    ];
    const result = flattenFilePaths(files);
    expect(result).toEqual(["folder1/file1.txt", "folder1/file2.txt"]);
  });

  it("should handle mixed files and folders", () => {
    const files: UnicodeVersionFile[] = [
      {
        name: "root-file.txt",
        path: "root-file.txt",
      },
      {
        name: "folder1",
        path: "folder1",
        children: [
          { name: "nested-file.txt", path: "folder1/nested-file.txt" },
        ],
      },
      { name: "another-root-file.txt", path: "another-root-file.txt" },
    ];
    const result = flattenFilePaths(files);
    expect(result).toEqual([
      "root-file.txt",
      "folder1/nested-file.txt",
      "another-root-file.txt",
    ]);
  });

  it("should handle deeply nested structures", () => {
    const files: UnicodeVersionFile[] = [
      {
        name: "level1",
        path: "level1",
        children: [
          {
            name: "level2",
            path: "level2",
            children: [
              {
                name: "level3",
                path: "level3",
                children: [
                  { name: "deep-file.txt", path: "deep-file.txt" },
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
    const files: UnicodeVersionFile[] = [
      { name: "file.txt", path: "file.txt" },
      {
        name: "folder",
        path: "folder",
        children: [
          { name: "nested.txt", path: "nested.txt" },
        ],
      },
    ];
    const result = flattenFilePaths(files, "prefix");
    expect(result).toEqual(["prefix/file.txt", "prefix/folder/nested.txt"]);
  });

  it("should handle empty prefix", () => {
    const files: UnicodeVersionFile[] = [
      {
        name: "file.txt",
        path: "file.txt",
      },
    ];
    const result = flattenFilePaths(files, "");
    expect(result).toEqual(["file.txt"]);
  });

  it("should handle folders with empty children arrays", () => {
    const files: UnicodeVersionFile[] = [
      {
        name: "empty-folder",
        path: "empty-folder",
        children: [],
      },
      { name: "file.txt", path: "file.txt" },
    ];
    const result = flattenFilePaths(files);
    expect(result).toEqual(["file.txt"]);
  });

  it("should handle complex nested structure with multiple levels", () => {
    const files: UnicodeVersionFile[] = [
      {
        name: "docs",
        path: "docs",
        children: [
          { name: "readme.md", path: "readme.md" },
          {
            name: "api",
            path: "api",
            children: [
              { name: "index.html", path: "index.html" },
              { name: "methods.html", path: "methods.html" },
            ],
          },
        ],
      },
      {
        name: "src",
        path: "src",
        children: [
          { name: "index.ts", path: "index.ts" },
          {
            name: "utils",
            path: "utils",
            children: [
              { name: "helpers.ts", path: "helpers.ts" },
            ],
          },
        ],
      },
      { name: "package.json", path: "package.json" },
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
});
