import { sep } from "pathe";
import { describe, expect, it } from "vitest";
import { BridgePathTraversal } from "../src/errors";
import { decodePathSafely, isWithinBase, resolveSafePath } from "../src/utils";

describe("isWithinBase", () => {
  describe("input validation", () => {
    it.each([
      [null, "/base"],
      [undefined, "/base"],
      [123, "/base"],
      [{}, "/base"],
      [[], "/base"],
      [true, "/base"],
      ["/path", null],
      ["/path", undefined],
      ["/path", 123],
      ["/path", {}],
      ["/path", []],
      ["/path", false],
      [null, null],
      [undefined, undefined],
    ])("should return false for non-string inputs: resolvedPath=%s, basePath=%s", (resolvedPath, basePath) => {
      expect(isWithinBase(
        // @ts-expect-error only for testing
        resolvedPath,
        basePath,
      )).toBe(false);
    });
  });

  describe("exact path matches", () => {
    it.each([
      ["/home/user", "/home/user"],
      ["/root", "/root"],
      ["/", "/"],
      ["relative/path", "relative/path"],
    ])("should return true when paths are identical: %s === %s", (resolved, base) => {
      expect(isWithinBase(resolved, base)).toBe(true);
    });
  });

  describe("paths within base directory", () => {
    it.each([
      ["/home/user/documents", "/home/user"],
      ["/home/user/documents/file.txt", "/home/user"],
      ["/root/app/src/index.js", "/root/app"],
      ["base/nested/deep", "base"],
      ["base/nested/deep/file.txt", "base/nested"],
      ["/var/www/html/index.html", "/var/www"],
      ["src/components/Button.tsx", "src"],
    ])("should return true when resolved path is within base: %s within %s", (resolved, base) => {
      expect(isWithinBase(resolved, base)).toBe(true);
    });

    it("should validate file uploads within upload directory", () => {
      const uploadDir = "/var/www/uploads";
      expect.soft(isWithinBase("/var/www/uploads/user123/file.jpg", uploadDir)).toBe(true);
      expect.soft(isWithinBase("/var/www/uploads/file.txt", uploadDir)).toBe(true);
      expect.soft(isWithinBase("/var/www/static/hack.php", uploadDir)).toBe(false);
      expect.soft(isWithinBase("/etc/passwd", uploadDir)).toBe(false);
    });

    it("should validate template file includes", () => {
      const templateDir = "templates";
      expect.soft(isWithinBase("templates/layout.html", templateDir)).toBe(true);
      expect.soft(isWithinBase("templates/partials/header.html", templateDir)).toBe(true);
      expect.soft(isWithinBase("config/secrets.json", templateDir)).toBe(false);
      expect.soft(isWithinBase("templates/../config.json", templateDir)).toBe(false);
    });
  });

  describe("paths outside base directory", () => {
    it.each([
      ["/home/other", "/home/user"],
      ["/root/different", "/root/app"],
      ["/var/log", "/var/www"],
      ["other/path", "base"],
      ["/completely/different", "/base"],
      ["sibling", "base"],
    ])("should return false when resolved path is outside base: %s outside %s", (resolved, base) => {
      expect(isWithinBase(resolved, base)).toBe(false);
    });
  });

  describe("partial path name matches", () => {
    it.each([
      ["/root2/file", "/root"],
      ["/home/user2/docs", "/home/user"],
      ["/var/www2", "/var/www"],
      ["base2/file", "base"],
      ["baseExtended", "base"],
      ["/app/config", "/ap"],
      ["testing", "test"],
    ])("should return false for partial matches without separator: %s vs %s", (resolved, base) => {
      expect(isWithinBase(resolved, base)).toBe(false);
    });

    it("should prevent similar-named directory bypasses", () => {
      const projectRoot = "/home/dev/myapp";
      expect.soft(isWithinBase("/home/dev/myapp/src/index.ts", projectRoot)).toBe(true);
      expect.soft(isWithinBase("/home/dev/myapp/node_modules/lib/index.js", projectRoot)).toBe(true);
      expect.soft(isWithinBase("/home/dev/otherapp/src/file.ts", projectRoot)).toBe(false);
      expect.soft(isWithinBase("/home/dev/myapp-backup/file.ts", projectRoot)).toBe(false);
    });
  });

  describe("normalized path handling", () => {
    it("should handle paths with redundant separators", () => {
      expect.soft(isWithinBase("/home//user///docs", "/home/user")).toBe(true);
      expect.soft(isWithinBase("/home/user", "/home//user")).toBe(true);
      expect.soft(isWithinBase("base//nested//file", "base")).toBe(true);
    });

    it("should handle paths with dot segments", () => {
      expect.soft(isWithinBase("/home/user/./docs", "/home/user")).toBe(true);
      expect.soft(isWithinBase("/home/user/docs/.", "/home/user")).toBe(true);
      expect.soft(isWithinBase("/home/./user/docs", "/home/user")).toBe(true);
    });

    it("should handle paths with double dot segments", () => {
      expect.soft(isWithinBase("/home/user/docs/../file", "/home/user")).toBe(true);
      expect.soft(isWithinBase("/home/user/temp/../docs/file", "/home/user")).toBe(true);
      // Path that goes outside then back in
      expect.soft(isWithinBase("/home/user/../user/docs", "/home/user")).toBe(true);
    });

    it("should handle paths that escape via double dots", () => {
      expect.soft(isWithinBase("/home/user/../../etc", "/home/user")).toBe(false);
      expect.soft(isWithinBase("/home/user/../other", "/home/user")).toBe(false);
      expect.soft(isWithinBase("base/../outside", "base")).toBe(false);
    });

    it("should reject path traversal attack attempts", () => {
      const safeDir = "/app/userdata";
      expect.soft(isWithinBase("/app/userdata/../../../etc/passwd", safeDir)).toBe(false);
      expect.soft(isWithinBase("/app/userdata/subdir/../../config", safeDir)).toBe(false);
      expect.soft(isWithinBase("/app/userdata/file/../../../sensitive", safeDir)).toBe(false);
    });
  });

  describe("special path formats", () => {
    it("should handle empty strings", () => {
      expect.soft(isWithinBase("", "")).toBe(false);
      expect.soft(isWithinBase("path", "")).toBe(false);
      expect.soft(isWithinBase("", "base")).toBe(false);
    });

    it("should handle root paths", () => {
      expect.soft(isWithinBase("/home", "/")).toBe(true);
      expect.soft(isWithinBase("/var/log", "/")).toBe(true);
      expect.soft(isWithinBase("/", "/")).toBe(true);
    });

    it("should handle relative vs absolute paths", () => {
      expect.soft(isWithinBase("home/user", "/home/user")).toBe(false);
      expect.soft(isWithinBase("/home/user", "home/user")).toBe(false);
      expect.soft(isWithinBase("relative/path", "relative")).toBe(true);
    });

    it("should handle trailing separators", () => {
      expect.soft(isWithinBase("/home/user/docs", "/home/user/")).toBe(true);
      expect.soft(isWithinBase("/home/user/docs/", "/home/user")).toBe(true);
      expect.soft(isWithinBase("/home/user/", "/home/user")).toBe(true);
    });
  });

  describe("case sensitivity", () => {
    it("should be case sensitive on unix-like systems", () => {
      expect.soft(isWithinBase("/Home/User", "/home/user")).toBe(false);
      expect.soft(isWithinBase("/home/User/docs", "/home/user")).toBe(false);
      expect.soft(isWithinBase("Base/file", "base")).toBe(false);
    });
  });

  describe("separator handling", () => {
    it("should properly use path separators to prevent partial matches", () => {
      const basePath = "/home/user";
      const validPath = `${basePath + sep}docs`;
      const invalidPath = `${basePath}extra`;

      expect.soft(isWithinBase(validPath, basePath)).toBe(true);
      expect.soft(isWithinBase(invalidPath, basePath)).toBe(false);
    });

    it("should handle mixed separators in paths", () => {
      // Note: pathe.normalize should handle this, but testing edge cases
      expect.soft(isWithinBase("/home/user\\docs", "/home/user")).toBe(true);
      expect.soft(isWithinBase("base\\nested/file", "base")).toBe(true);
    });
  });
});

describe("decodePathSafely", () => {
  describe("input validation", () => {
    it("should throw TypeError for non-string input", () => {
      // @ts-expect-error for testing only
      expect.soft(() => decodePathSafely(null)).toThrow(TypeError);
      // @ts-expect-error for testing only
      expect.soft(() => decodePathSafely(undefined)).toThrow(TypeError);
      // @ts-expect-error for testing only
      expect.soft(() => decodePathSafely(123)).toThrow(TypeError);
      // @ts-expect-error for testing only
      expect.soft(() => decodePathSafely({})).toThrow(TypeError);
      // @ts-expect-error for testing only
      expect.soft(() => decodePathSafely([])).toThrow(TypeError);
      // @ts-expect-error for testing only
      expect.soft(() => decodePathSafely(true)).toThrow(TypeError);
    });
  });

  describe("basic decoding", () => {
    it("should return unencoded paths unchanged", () => {
      expect.soft(decodePathSafely("simple/path")).toBe("simple/path");
      expect.soft(decodePathSafely("path/to/file.txt")).toBe("path/to/file.txt");
      expect.soft(decodePathSafely("")).toBe("");
    });

    it("should decode standard URI-encoded paths", () => {
      expect.soft(decodePathSafely("hello%20world")).toBe("hello world");
      expect.soft(decodePathSafely("path%2Fto%2Ffile")).toBe("path/to/file");
      expect.soft(decodePathSafely("file%2Etxt")).toBe("file.txt");
    });

    it("should decode paths with special characters", () => {
      expect.soft(decodePathSafely("caf%C3%A9")).toBe("café");
      expect.soft(decodePathSafely("file%21%40%23.txt")).toBe("file!@#.txt");
    });

    it("should decode file paths with spaces and special characters", () => {
      expect(decodePathSafely("My%20Documents%2ffile%20(1)%2etxt")).toBe("My Documents/file (1).txt");
    });

    it("should handle URL-like paths", () => {
      expect(decodePathSafely("path%2fto%2ffile%3fname%3Dvalue")).toBe("path/to/file?name=value");
    });

    it("should handle empty string", () => {
      expect(decodePathSafely("")).toBe("");
    });

    it("should preserve already decoded special characters", () => {
      expect(decodePathSafely("path/./to/../file")).toBe("path/./to/../file");
    });
  });

  describe("manual encoding replacements", () => {
    it("should decode manual dot encodings (%2e)", () => {
      expect.soft(decodePathSafely("file%2etxt")).toBe("file.txt");
      expect.soft(decodePathSafely("file%2Etxt")).toBe("file.txt"); // uppercase
      expect.soft(decodePathSafely("%2e%2e/parent")).toBe("../parent");
    });

    it("should decode manual forward slash encodings (%2f)", () => {
      expect.soft(decodePathSafely("path%2fto%2ffile")).toBe("path/to/file");
      expect.soft(decodePathSafely("path%2Fto%2Ffile")).toBe("path/to/file"); // uppercase
    });

    it("should decode manual backslash encodings (%5c)", () => {
      expect.soft(decodePathSafely("path%5cto%5cfile")).toBe("path\\to\\file");
      expect.soft(decodePathSafely("path%5Cto%5Cfile")).toBe("path\\to\\file"); // uppercase
    });

    it("should handle mixed case encodings", () => {
      expect.soft(decodePathSafely("%2E%2f%5C")).toBe("./\\");
      expect.soft(decodePathSafely("%2e%2F%5c")).toBe("./\\");
    });

    it("should handle string with only encoded characters", () => {
      expect(decodePathSafely("%2e%2f%5c")).toBe("./\\");
    });

    it("should handle paths with multiple consecutive encodings", () => {
      expect.soft(decodePathSafely("%2e%2e%2f%2e%2e")).toBe("../..");
      expect.soft(decodePathSafely("%20%20%20")).toBe("   "); // multiple spaces
    });
  });

  describe("multi-level decoding", () => {
    it("should decode multiple levels of encoding", () => {
      // double-encoded space: %20 -> %2520 -> %252520
      expect.soft(decodePathSafely("%252520")).toBe(" ");

      // double-encoded forward slash
      expect.soft(decodePathSafely("%252F")).toBe("/");
    });

    it("should handle mixed URI and manual encodings", () => {
      // uri-encoded %2f becomes %2f, then manually decoded to /
      expect.soft(decodePathSafely("%252f")).toBe("/");
      expect.soft(decodePathSafely("%252e")).toBe(".");
    });

    it("should stop when no further decoding is possible", () => {
      const result = decodePathSafely("normal/path/with%20space");
      expect(result).toBe("normal/path/with space");
    });

    it("should decode common path traversal attempts", () => {
      expect.soft(decodePathSafely("%2e%2e%2f%2e%2e%2fconfig")).toBe("../../config");
      expect.soft(decodePathSafely("%2e%5c%2e%5c")).toBe(".\\.\\");
    });
  });

  describe("error handling for invalid URI encoding", () => {
    it("should continue decoding when decodeURIComponent fails", () => {
      // invalid uri sequence that causes decodeURIComponent to throw
      const invalidUri = "%E0%A4%A";

      const result = decodePathSafely(`${invalidUri}%2f` + `test`);
      expect(result).toContain("/test"); // manual decoding should still work
    });

    it("should handle malformed percent encoding gracefully", () => {
      expect.soft(() => decodePathSafely("%")).not.toThrow();
      expect.soft(() => decodePathSafely("%2")).not.toThrow();
      expect.soft(() => decodePathSafely("%GG")).not.toThrow();
    });
  });

  describe("maximum iteration protection", () => {
    it("should throw error when maximum iterations exceeded", () => {
      let maliciousInput = "%";
      for (let i = 0; i < 15; i++) {
        maliciousInput = encodeURIComponent(maliciousInput);
      }

      expect(() => decodePathSafely(maliciousInput)).toThrow(
        "Maximum decoding iterations exceeded - possible malicious input",
      );
    });

    it("should allow exactly maximum iterations without error", () => {
      let input = "test";
      for (let i = 0; i < 9; i++) { // 9 levels of encoding = 9 iterations to decode
        input = encodeURIComponent(input);
      }

      expect.soft(() => decodePathSafely(input)).not.toThrow();
      expect.soft(decodePathSafely(input)).toBe("test");
    });

    it("should handle very long paths", () => {
      const longPath = `${"a".repeat(1000)}%20${"b".repeat(1000)}`;
      const expected = `${"a".repeat(1000)} ${"b".repeat(1000)}`;
      expect(decodePathSafely(longPath)).toBe(expected);
    });
  });
});
