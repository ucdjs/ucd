import { describe, expect, it } from "vitest";
import { isWithinBase } from "../src/security";
import { isCaseSensitive } from "../src/utils";

describe("isWithinBase", () => {
  it("should return false for non-string inputs", () => {
    expect(isWithinBase(null as any, "/base")).toBe(false);
    expect(isWithinBase("/path", undefined as any)).toBe(false);
    expect(isWithinBase(123 as any, "/base")).toBe(false);
  });

  it("should return false for empty strings", () => {
    expect(isWithinBase("", "/base")).toBe(false);
    expect(isWithinBase("/path", "")).toBe(false);
    expect(isWithinBase("   ", "/base")).toBe(false);
    expect(isWithinBase("/path", "   ")).toBe(false);
  });

  it("should return true when paths are identical", () => {
    expect(isWithinBase("/base", "/base")).toBe(true);
    expect(isWithinBase("/path/to/dir", "/path/to/dir")).toBe(true);
  });

  it("should return true when resolved path is within base path", () => {
    expect(isWithinBase("/base/subdir", "/base")).toBe(true);
    expect(isWithinBase("/base/subdir/file.txt", "/base")).toBe(true);
    expect(isWithinBase("/root/path/to/file", "/root")).toBe(true);
  });

  it("should return false when resolved path is outside base path", () => {
    expect(isWithinBase("/other/path", "/base")).toBe(false);
    expect(isWithinBase("/base2/file", "/base")).toBe(false);
    expect(isWithinBase("/bas/file", "/base")).toBe(false); // partial match prevention
  });

  it("should handle root paths correctly", () => {
    expect(isWithinBase("/", "/")).toBe(true);
    expect(isWithinBase("/subdir", "/")).toBe(true);
    expect(isWithinBase("/path", "/other")).toBe(false);
  });

  it("should normalize paths before comparison", () => {
    expect(isWithinBase("/base/./subdir", "/base")).toBe(true);
    expect(isWithinBase("/base/../base/subdir", "/base")).toBe(true);
    expect(isWithinBase("/base//subdir", "/base")).toBe(true);
  });

  it("should prepend leading slashes when missing", () => {
    expect(isWithinBase("base/subdir", "base")).toBe(true);
    expect(isWithinBase("path/to/file", "path")).toBe(true);
  });

  describe("case sensitivity", () => {
    it.runIf(isCaseSensitive)("should be case-sensitive on case-sensitive platforms", () => {
      expect(isWithinBase("/Base/subdir", "/base")).toBe(false);
      expect(isWithinBase("/base/SubDir", "/base")).toBe(true);
      expect(isWithinBase("/BASE/SUBDIR", "/base")).toBe(false);
    });

    it.runIf(!isCaseSensitive)("should be case-insensitive on case-insensitive platforms", () => {
      expect(isWithinBase("/Base/subdir", "/base")).toBe(true);
      expect(isWithinBase("/base/SubDir", "/base")).toBe(true);
      expect(isWithinBase("/BASE/SUBDIR", "/base")).toBe(true);
    });
  });

  it("should handle Windows-style paths", () => {
    expect(isWithinBase("\\base\\subdir", "\\base")).toBe(true);
    expect(isWithinBase("C:\\base\\subdir", "C:\\base")).toBe(true);
  });

  it("should prevent partial directory name matches", () => {
    expect(isWithinBase("/root2/file", "/root")).toBe(false);
    expect(isWithinBase("/basepath/file", "/base")).toBe(false);
    expect(isWithinBase("/based/file", "/base")).toBe(false);
  });

  it("should handle paths with trailing separators", () => {
    expect(isWithinBase("/base/subdir/", "/base/")).toBe(true);
    expect(isWithinBase("/base/subdir", "/base/")).toBe(true);
    expect(isWithinBase("/base/", "/base")).toBe(true);
  });
});
