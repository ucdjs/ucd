import type { BackendEntry } from "../src";
import { describe, expect, it } from "vitest";
import { BackendEntryIsDirectory } from "../src/errors";
import {
  assertFilePath,
  isDirectoryPath,
  normalizeEntryPath,
  normalizePathSeparators,
  sortEntries,
} from "../src/utils";

describe("consumer utils", () => {
  it("detects directory-like paths", () => {
    expect(isDirectoryPath("/")).toBe(true);
    expect(isDirectoryPath("./")).toBe(true);
    expect(isDirectoryPath("../")).toBe(true);
    expect(isDirectoryPath("/nested/")).toBe(true);
    expect(isDirectoryPath("/file.txt")).toBe(false);
  });

  it("asserts file paths", () => {
    expect(() => assertFilePath("/file.txt")).not.toThrow();
    expect(() => assertFilePath("/nested/")).toThrow(BackendEntryIsDirectory);
  });

  it("normalizes entry paths to the backend contract", () => {
    expect(normalizeEntryPath("nested\\file.txt", "file")).toBe("/nested/file.txt");
    expect(normalizeEntryPath("nested\\dir\\", "directory")).toBe("/nested/dir/");
  });

  it("normalizes path separators", () => {
    expect(normalizePathSeparators("nested\\file.txt")).toBe("nested/file.txt");
  });

  it("sorts entries recursively by path", () => {
    const entries: BackendEntry[] = [
      {
        type: "directory",
        name: "b-dir",
        path: "/b-dir/",
        children: [
          { type: "file", name: "z.txt", path: "/b-dir/z.txt" },
          { type: "file", name: "a.txt", path: "/b-dir/a.txt" },
        ],
      },
      { type: "file", name: "a.txt", path: "/a.txt" },
    ];

    expect(sortEntries(entries)).toEqual([
      { type: "file", name: "a.txt", path: "/a.txt" },
      {
        type: "directory",
        name: "b-dir",
        path: "/b-dir/",
        children: [
          { type: "file", name: "a.txt", path: "/b-dir/a.txt" },
          { type: "file", name: "z.txt", path: "/b-dir/z.txt" },
        ],
      },
    ]);
  });
});
