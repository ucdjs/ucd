import { describe, expect, it } from "vitest";
import { MaximumDecodingIterationsExceededError } from "../src/errors";
import { decodePathSafely, isWithinBase } from "../src/security";
import { isCaseSensitive } from "../src/utils";

describe("isWithinBase", () => {
  it("should return false for non-string inputs", () => {
    expect.soft(isWithinBase(null as any, "/base")).toBe(false);
    expect.soft(isWithinBase("/path", undefined as any)).toBe(false);
    expect.soft(isWithinBase(123 as any, "/base")).toBe(false);
  });

  it("should return false for empty strings", () => {
    expect.soft(isWithinBase("", "/base")).toBe(false);
    expect.soft(isWithinBase("/path", "")).toBe(false);
    expect.soft(isWithinBase("   ", "/base")).toBe(false);
    expect.soft(isWithinBase("/path", "   ")).toBe(false);
  });

  it("should return true when paths are identical", () => {
    expect.soft(isWithinBase("/base", "/base")).toBe(true);
    expect.soft(isWithinBase("/path/to/dir", "/path/to/dir")).toBe(true);
  });

  it("should return true when resolved path is within base path", () => {
    expect.soft(isWithinBase("/base/subdir", "/base")).toBe(true);
    expect.soft(isWithinBase("/base/subdir/file.txt", "/base")).toBe(true);
    expect.soft(isWithinBase("/root/path/to/file", "/root")).toBe(true);
  });

  it("should return false when resolved path is outside base path", () => {
    expect.soft(isWithinBase("/other/path", "/base")).toBe(false);
    expect.soft(isWithinBase("/base2/file", "/base")).toBe(false);
    expect.soft(isWithinBase("/bas/file", "/base")).toBe(false); // partial match prevention
  });

  it("should handle root paths correctly", () => {
    expect.soft(isWithinBase("/", "/")).toBe(true);
    expect.soft(isWithinBase("/subdir", "/")).toBe(true);
    expect.soft(isWithinBase("/path", "/other")).toBe(false);
  });

  it("should normalize paths before comparison", () => {
    expect.soft(isWithinBase("/base/./subdir", "/base")).toBe(true);
    expect.soft(isWithinBase("/base/../base/subdir", "/base")).toBe(true);
    expect.soft(isWithinBase("/base//subdir", "/base")).toBe(true);
  });

  it("should prepend leading slashes when missing", () => {
    expect.soft(isWithinBase("base/subdir", "base")).toBe(true);
    expect.soft(isWithinBase("path/to/file", "path")).toBe(true);
  });

  describe("case sensitivity", () => {
    it.runIf(isCaseSensitive)("should be case-sensitive on case-sensitive platforms", () => {
      expect.soft(isWithinBase("/Base/subdir", "/base")).toBe(false);
      expect.soft(isWithinBase("/base/SubDir", "/base")).toBe(true);
      expect.soft(isWithinBase("/BASE/SUBDIR", "/base")).toBe(false);
    });

    it.runIf(!isCaseSensitive)("should be case-insensitive on case-insensitive platforms", () => {
      expect.soft(isWithinBase("/Base/subdir", "/base")).toBe(true);
      expect.soft(isWithinBase("/base/SubDir", "/base")).toBe(true);
      expect.soft(isWithinBase("/BASE/SUBDIR", "/base")).toBe(true);
    });
  });

  it("should handle Windows-style paths", () => {
    expect.soft(isWithinBase("\\base\\subdir", "\\base")).toBe(true);
    expect.soft(isWithinBase("C:\\base\\subdir", "C:\\base")).toBe(true);
  });

  it("should prevent partial directory name matches", () => {
    expect.soft(isWithinBase("/root2/file", "/root")).toBe(false);
    expect.soft(isWithinBase("/basepath/file", "/base")).toBe(false);
    expect.soft(isWithinBase("/based/file", "/base")).toBe(false);
  });

  it("should handle paths with trailing separators", () => {
    expect.soft(isWithinBase("/base/subdir/", "/base/")).toBe(true);
    expect.soft(isWithinBase("/base/subdir", "/base/")).toBe(true);
    expect.soft(isWithinBase("/base/", "/base")).toBe(true);
  });
});

describe("decodePathSafely", () => {
  it("should throw TypeError for non-string inputs", () => {
    expect.soft(() => decodePathSafely(null as any)).toThrow(TypeError);
    expect.soft(() => decodePathSafely(undefined as any)).toThrow(TypeError);
    expect.soft(() => decodePathSafely(123 as any)).toThrow(TypeError);
    expect.soft(() => decodePathSafely({} as any)).toThrow(TypeError);
  });

  it("should decode standard URL encoding", () => {
    expect.soft(decodePathSafely("path%20with%20spaces")).toBe("path with spaces");
    expect.soft(decodePathSafely("file%2Ename%2Eext")).toBe("file.name.ext");
    expect.soft(decodePathSafely("folder%2Ffile")).toBe("folder/file");
  });

  it("should handle manual encoding replacements", () => {
    expect.soft(decodePathSafely("file%2ename")).toBe("file.name");
    expect.soft(decodePathSafely("path%2fto%2ffile")).toBe("path/to/file");
    expect.soft(decodePathSafely("windows%5cpath")).toBe("windows\\path");
  });

  it("should handle mixed encoding types", () => {
    expect.soft(decodePathSafely("file%2Ename%20with%20spaces")).toBe("file.name with spaces");
    expect.soft(decodePathSafely("%2e%2e%2fetc%2fpasswd")).toBe("../etc/passwd");
  });

  it("should handle case-insensitive encoding", () => {
    expect.soft(decodePathSafely("file%2Ename")).toBe("file.name");
    expect.soft(decodePathSafely("file%2fpath")).toBe("file/path");
    expect.soft(decodePathSafely("file%5cpath")).toBe("file\\path");
  });

  it("should return unchanged for already decoded paths", () => {
    expect.soft(decodePathSafely("normal/path/file.txt")).toBe("normal/path/file.txt");
    expect.soft(decodePathSafely("C:\\Windows\\System32")).toBe("C:\\Windows\\System32");
  });

  it("should handle empty strings", () => {
    expect(decodePathSafely("")).toBe("");
  });

  it("should handle complex nested encodings", () => {
    expect.soft(decodePathSafely("%2520")).toBe(" "); // %25 is %, so %2520 becomes %20, then %20 becomes space
    expect(decodePathSafely("%252e")).toBe(".");
  });

  it("should throw MaximumDecodingIterationsExceededError for infinite loops", () => {
    const maliciousInput = (() => {
      let str = "æøå";
      for (let i = 0; i < 15; i++) {
        str = encodeURIComponent(str);
      }
      return str;
    })();

    expect.soft(() => decodePathSafely(maliciousInput)).toThrow(MaximumDecodingIterationsExceededError);
  });

  it("should handle decodeURIComponent failures gracefully", () => {
    expect.soft(decodePathSafely("%")).toBe("%");
    expect.soft(decodePathSafely("%1")).toBe("%1");
    expect.soft(decodePathSafely("%XY")).toBe("%XY");
  });

  it("should decode until no more changes", () => {
    expect(decodePathSafely("file%252Ename")).toBe("file.name"); // %252E becomes %2E, then becomes .
  });
});
