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
      // path that goes outside then back in
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
      const validPath = `${`${basePath}/`}docs`;
      const invalidPath = `${basePath}extra`;

      expect.soft(isWithinBase(validPath, basePath)).toBe(true);
      expect.soft(isWithinBase(invalidPath, basePath)).toBe(false);
    });

    it("should handle mixed separators in paths", () => {
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

describe("resolveSafePath", () => {
  describe("input validation", () => {
    it("should throw error when base path is missing or empty", () => {
      expect(() => resolveSafePath("", "file.txt")).toThrow("Base path and input path are required");
      // @ts-expect-error for testing only
      expect(() => resolveSafePath(null, "file.txt")).toThrow("Base path and input path are required");
      // @ts-expect-error for testing only
      expect(() => resolveSafePath(undefined, "file.txt")).toThrow("Base path and input path are required");
    });

    it("should throw error when input path is missing or empty", () => {
      expect(() => resolveSafePath("/base", "")).toThrow("Base path and input path are required");
      // @ts-expect-error for testing only
      expect(() => resolveSafePath("/base", null)).toThrow("Base path and input path are required");
      // @ts-expect-error for testing only
      expect(() => resolveSafePath("/base", undefined)).toThrow("Base path and input path are required");
    });

    it("should throw TypeError when base path is not a string", () => {
      // @ts-expect-error for testing only
      expect(() => resolveSafePath(123, "file.txt")).toThrow("Base path and input path must be strings");
      // @ts-expect-error for testing only
      expect(() => resolveSafePath({}, "file.txt")).toThrow("Base path and input path must be strings");
      // @ts-expect-error for testing only
      expect(() => resolveSafePath([], "file.txt")).toThrow("Base path and input path must be strings");
      // @ts-expect-error for testing only
      expect(() => resolveSafePath(true, "file.txt")).toThrow("Base path and input path must be strings");
    });

    it("should throw TypeError when input path is not a string", () => {
      // @ts-expect-error for testing only
      expect(() => resolveSafePath("/base", 123)).toThrow("Base path and input path must be strings");
      // @ts-expect-error for testing only
      expect(() => resolveSafePath("/base", {})).toThrow("Base path and input path must be strings");
      // @ts-expect-error for testing only
      expect(() => resolveSafePath("/base", [])).toThrow("Base path and input path must be strings");
      // @ts-expect-error for testing only
      expect(() => resolveSafePath("/base", true)).toThrow("Base path and input path must be strings");
    });
  });

  describe("basic path resolution", () => {
    it("should resolve simple relative paths", () => {
      expect.soft(resolveSafePath("/home/user", "documents")).toBe("/home/user/documents");
      expect.soft(resolveSafePath("/var/www", "index.html")).toBe("/var/www/index.html");
      expect.soft(resolveSafePath("relative/base", "file.txt")).toBe(`${process.cwd()}/relative/base/file.txt`);
    });

    it("should resolve nested relative paths", () => {
      expect.soft(resolveSafePath("/home/user", "docs/file.txt")).toBe("/home/user/docs/file.txt");
      expect.soft(resolveSafePath("/app", "src/components/Button.tsx")).toBe("/app/src/components/Button.tsx");
    });

    it("should handle paths with dots", () => {
      expect.soft(resolveSafePath("/home/user", "./documents")).toBe("/home/user/documents");
      expect.soft(resolveSafePath("/home/user", "docs/./file.txt")).toBe("/home/user/docs/file.txt");
    });

    it("should resolve paths that go up then down safely", () => {
      expect.soft(resolveSafePath("/home/user", "temp/../documents/file.txt")).toBe("/home/user/documents/file.txt");
      expect.soft(resolveSafePath("/app/public", "assets/../images/logo.png")).toBe("/app/public/images/logo.png");
    });
  });

  describe("absolute path handling", () => {
    it("should treat absolute input paths as relative to base", () => {
      expect.soft(resolveSafePath("/home/user", "/documents/file.txt")).toBe("/home/user/documents/file.txt");
      expect.soft(resolveSafePath("/var/www", "/html/index.html")).toBe("/var/www/html/index.html");
    });

    it("should handle absolute paths with complex structures", () => {
      expect.soft(resolveSafePath("/app", "/api/v1/users.json")).toBe("/app/api/v1/users.json");
      expect.soft(resolveSafePath("/home/user/project", "/src/index.ts")).toBe("/home/user/project/src/index.ts");
    });
  });

  describe("url decoding integration", () => {
    it("should decode URL-encoded paths", () => {
      expect.soft(resolveSafePath("/home/user", "My%20Documents")).toBe("/home/user/My Documents");
      expect.soft(resolveSafePath("/var/www", "file%2Etxt")).toBe("/var/www/file.txt");
      expect.soft(resolveSafePath("/app", "folder%2Ffile%2Etxt")).toBe("/app/folder/file.txt");
    });

    it("should handle multiple levels of URL encoding", () => {
      expect.soft(resolveSafePath("/home/user", "%252520file")).toBe("/home/user/ file");
      expect.soft(resolveSafePath("/app", "%252Fapi%252Fusers")).toBe("/app/api/users");
    });

    it("should decode common manual encodings", () => {
      expect.soft(resolveSafePath("/base", "file%2etxt")).toBe("/base/file.txt");
      expect.soft(resolveSafePath("/base", "path%2fto%2ffile")).toBe("/base/path/to/file");
      expect.soft(resolveSafePath("/base", "path%5cto%5cfile")).toBe("/base/path/to/file");
    });

    it("should handle invalid URL encoding gracefully", () => {
      expect.soft(() => resolveSafePath("/base", "%GG%2efile")).not.toThrow();
      expect.soft(resolveSafePath("/base", "%GG%2efile")).toBe("/base/%GG.file");
    });
  });

  describe("path traversal protection", () => {
    it("should throw BridgePathTraversal for simple traversal attempts", () => {
      expect.soft(() => resolveSafePath("/home/user", "../config")).toThrow(BridgePathTraversal);
      expect.soft(() => resolveSafePath("/var/www", "../../etc/passwd")).toThrow(BridgePathTraversal);
      expect.soft(() => resolveSafePath("/app", "../../../root")).toThrow(BridgePathTraversal);
    });

    it("should throw BridgePathTraversal for encoded traversal attempts", () => {
      expect.soft(() => resolveSafePath("/home/user", "%2e%2e%2fconfig")).toThrow(BridgePathTraversal);
      expect.soft(() => resolveSafePath("/var/www", "%2e%2e%2f%2e%2e%2fetc%2fpasswd")).toThrow(BridgePathTraversal);
      expect.soft(() => resolveSafePath("/app", "..%2f..%2f..%2froot")).toThrow(BridgePathTraversal);
    });

    it("should throw BridgePathTraversal for complex traversal patterns", () => {
      expect.soft(() => resolveSafePath("/home/user", "docs/../../config")).toThrow(BridgePathTraversal);
      expect.soft(() => resolveSafePath("/app/public", "assets/../../../private")).toThrow(BridgePathTraversal);
      expect.soft(() => resolveSafePath("/var/www", "html/uploads/../../../etc")).toThrow(BridgePathTraversal);
    });

    it.todo("should throw BridgePathTraversal with absolute paths that resolve outside", () => {
      expect.soft(() => resolveSafePath("/home/user", "/etc/passwd")).toThrow(BridgePathTraversal);
      expect.soft(() => resolveSafePath("/app", "/var/log/system.log")).toThrow(BridgePathTraversal);
    });

    it("should handle mixed encoding and traversal attempts", () => {
      expect.soft(() => resolveSafePath("/secure", "%2e%2e%2f%2e%2e%2fpasswd")).toThrow(BridgePathTraversal);
      expect.soft(() => resolveSafePath("/app", "folder%2f%2e%2e%2f%2e%2e%2fconfig")).toThrow(BridgePathTraversal);
    });
  });

  describe("path normalization and formatting", () => {
    it("should handle base paths with trailing slashes", () => {
      expect.soft(resolveSafePath("/home/user/", "documents")).toBe("/home/user/documents");
      expect.soft(resolveSafePath("/var/www/", "html/index.html")).toBe("/var/www/html/index.html");
    });

    it("should handle paths with redundant separators", () => {
      expect.soft(resolveSafePath("/home//user", "docs//file.txt")).toBe("/home/user/docs/file.txt");
      expect.soft(resolveSafePath("/app", "src///components//Button.tsx")).toBe("/app/src/components/Button.tsx");
    });

    it("should handle very long paths", () => {
      const longPath = `${"a".repeat(100)}/${"b".repeat(100)}.txt`;
      const result = resolveSafePath("/base", longPath);

      expect(result).toBe(`/base/${longPath}`);
    });

    it("should handle paths with special characters", () => {
      expect.soft(resolveSafePath("/home/user", "café.txt")).toBe("/home/user/café.txt");
      expect.soft(resolveSafePath("/app", "file!@#$%^&*().txt")).toBe("/app/file!@#$%^&*().txt");
    });
  });

  describe("directory traversal attack prevention", () => {
    it("should protect upload directories from traversal", () => {
      const uploadDir = "/var/uploads";

      // Valid uploads
      expect.soft(resolveSafePath(uploadDir, "user123/avatar.jpg")).toBe("/var/uploads/user123/avatar.jpg");
      expect.soft(resolveSafePath(uploadDir, "documents/report.pdf")).toBe("/var/uploads/documents/report.pdf");

      // Invalid attempts
      expect(() => resolveSafePath(uploadDir, "../config/database.yml")).toThrow(BridgePathTraversal);
      expect(() => resolveSafePath(uploadDir, "../../etc/passwd")).toThrow(BridgePathTraversal);
    });

    it("should protect template includes from directory traversal", () => {
      const templateDir = "/app/templates";

      // valid includes
      expect.soft(resolveSafePath(templateDir, "layout.html")).toBe("/app/templates/layout.html");
      expect.soft(resolveSafePath(templateDir, "partials/header.html")).toBe("/app/templates/partials/header.html");

      // invalid attempts
      expect.soft(() => resolveSafePath(templateDir, "../config/secrets.json")).toThrow(BridgePathTraversal);
      expect.soft(() => resolveSafePath(templateDir, "../../app.py")).toThrow(BridgePathTraversal);
    });

    it("should protect against encoded path traversal attacks", () => {
      const webRoot = "/var/www/html";

      // valid requests
      expect.soft(resolveSafePath(webRoot, "index.html")).toBe("/var/www/html/index.html");
      expect.soft(resolveSafePath(webRoot, "assets%2Fstyle.css")).toBe("/var/www/html/assets/style.css");

      // attack attempts
      expect(() => resolveSafePath(webRoot, "%2e%2e%2f%2e%2e%2fetc%2fpasswd")).toThrow(BridgePathTraversal);
      expect(() => resolveSafePath(webRoot, "..%252f..%252fetc%252fpasswd")).toThrow(BridgePathTraversal);
    });
  });

  describe("decoding error handling", () => {
    it("should throw error when path decoding fails due to malicious input", () => {
      // Create a deeply nested encoded string that exceeds max iterations
      let maliciousPath = "%";
      for (let i = 0; i < 15; i++) {
        maliciousPath = encodeURIComponent(maliciousPath);
      }

      expect(() => resolveSafePath("/base", maliciousPath)).toThrow("Failed to decode path safely");
    });

    it("should provide helpful error messages for decoding failures", () => {
      let maliciousPath = "%";
      for (let i = 0; i < 15; i++) {
        maliciousPath = encodeURIComponent(maliciousPath);
      }

      expect(() => resolveSafePath("/base", maliciousPath)).toThrow(/Failed to decode path safely.*possible malicious input/);
    });
  });

  describe("path resolution with URL decoding", () => {
    it("should resolve nested paths with URL-encoded components", () => {
      expect.soft(resolveSafePath("/app/public", "css/style.css")).toBe("/app/public/css/style.css");
      expect.soft(resolveSafePath("/app/public", "js%2Fapp.js")).toBe("/app/public/js/app.js");
      expect.soft(resolveSafePath("/app/public", "images/logo%20(1).png")).toBe("/app/public/images/logo (1).png");
    });

    it("should resolve complex nested structures", () => {
      expect.soft(resolveSafePath("/app/data", "users/123.json")).toBe("/app/data/users/123.json");
      expect.soft(resolveSafePath("/app/data", "reports%2F2023%2Fq1.pdf")).toBe("/app/data/reports/2023/q1.pdf");
      expect.soft(resolveSafePath("/base/path", "deep/nested/file.txt")).toBe("/base/path/deep/nested/file.txt");
    });

    it("should handle mixed encoding in nested paths", () => {
      expect.soft(resolveSafePath("/base/path", "projects/website/index.html")).toBe("/base/path/projects/website/index.html");
      expect.soft(resolveSafePath("/base/path", "photos%2Fvacation%2Fbeach.jpg")).toBe("/base/path/photos/vacation/beach.jpg");
      expect.soft(resolveSafePath("/base/path", "docs%2Ffile%20name.pdf")).toBe("/base/path/docs/file name.pdf");
    });
  });

  describe("traversal prevention from various base directories", () => {
    it("should prevent traversal from public directories", () => {
      expect.soft(() => resolveSafePath("/app/public", "../config/database.yml")).toThrow(BridgePathTraversal);
      expect.soft(() => resolveSafePath("/var/www", "../../etc/passwd")).toThrow(BridgePathTraversal);
    });

    it("should prevent traversal from data directories", () => {
      expect(() => resolveSafePath("/app/data", "../logs/error.log")).toThrow(BridgePathTraversal);
    });

    it("should prevent traversal from any base directory", () => {
      expect.soft(() => resolveSafePath("/base/path", "../.ssh/id_rsa")).toThrow(BridgePathTraversal);
      expect.soft(() => resolveSafePath("/base/path", "../../other/private.txt")).toThrow(BridgePathTraversal);
      expect.soft(() => resolveSafePath("/secure/dir", "../../../root/secret")).toThrow(BridgePathTraversal);
    });
  });
});
