import { isUnix, isWindows } from "#internal/test-utils";
import { describe, expect, it } from "vitest";
import { isWithinBase } from "../src/utils";

describe("isWithinBase", () => {
  it("input validation", () => {
    const cases = [
      [null, null],
      [undefined, undefined],
      [null, "/base"],
      [undefined, "/base"],
      ["/path", null],
      ["/path", undefined],
      [123, "/base"],
      ["/path", 123],
      [{}, "/base"],
      ["/path", {}],
      [[], "/base"],
      ["/path", []],
      [true, "/base"],
      ["/path", true],
      [false, "/base"],
      ["/path", false],
    ];

    for (const [resolved, base] of cases) {
      expect.soft(isWithinBase(
        // @ts-expect-error Just for testing
        resolved,
        base,
      )).toBe(false);
    }
  });

  it("exact path matches", () => {
    expect.soft(isWithinBase("/home/user", "/home/user")).toBe(true);
    expect.soft(isWithinBase("/root", "/root")).toBe(true);
    expect.soft(isWithinBase("/", "/")).toBe(true);
    expect.soft(isWithinBase("relative/path", "relative/path")).toBe(true);
  });

  describe("paths within base directory", () => {
    it.each([
      ["/home/user/documents", "/home/user"],
      ["/home/user/documents/file.txt", "/home/user"],

      ["/root/ucd/ArabicShaping.txt", "/root/ucd"],
      ["base/nested/deep", "base"],
      ["base/nested/deep/file.txt", "base/nested"],
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

  it("should handle paths outside base directory", () => {
    const cases = [
      ["/home/other", "/home/user"],
      ["/root/different", "/root/app"],
      ["/var/log", "/var/www"],
      ["other/path", "base"],
      ["/completely/different", "/base"],
      ["sibling", "base"],
    ] as [string, string][];

    for (const [resolved, base] of cases) {
      expect.soft(isWithinBase(resolved, base)).toBe(false);
    }
  });

  it("should prevent similar-named directory bypasses", () => {
    const projectRoot = "/home/dev/myapp";

    expect.soft(isWithinBase("/home/dev/myapp/src/index.ts", projectRoot)).toBe(true);
    expect.soft(isWithinBase("/home/dev/myapp/node_modules/lib/index.js", projectRoot)).toBe(true);
    expect.soft(isWithinBase("/home/dev/otherapp/src/file.ts", projectRoot)).toBe(false);
    expect.soft(isWithinBase("/home/dev/myapp-backup/file.ts", projectRoot)).toBe(false);
  });

  it("should prevent partial path name matches", () => {
    const cases = [
      ["/root2/file", "/root"],
      ["/home/user2/docs", "/home/user"],
      ["/var/www2", "/var/www"],
      ["base2/file", "base"],
      ["baseExtended", "base"],
      ["/app/config", "/ap"],
      ["testing", "test"],
    ] as [string, string][];

    for (const [resolved, base] of cases) {
      expect.soft(isWithinBase(resolved, base)).toBe(false);
    }
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

  describe.runIf(isUnix)("unix specific", () => {
    it("should handle absolute paths correctly", () => {
      expect.soft(isWithinBase("/home/user/documents/file.txt", "/home/user")).toBe(true);
      expect.soft(isWithinBase("/home/other/documents/file.txt", "/home/user")).toBe(false);
      expect.soft(isWithinBase("/var/log/system.log", "/home/user")).toBe(false);
    });

    it("should handle root paths", () => {
      expect.soft(isWithinBase("/var/log/file.txt", "/var")).toBe(true);
      expect.soft(isWithinBase("/etc/config", "/var")).toBe(false);
      expect.soft(isWithinBase("/", "/")).toBe(true);
      expect.soft(isWithinBase("/home", "/")).toBe(true);
      expect.soft(isWithinBase("/var/log", "/")).toBe(true);
    });

    it("should prevent partial path matches", () => {
      expect.soft(isWithinBase("/home/user2/file.txt", "/home/user")).toBe(false);
      expect.soft(isWithinBase("/home/username/file.txt", "/home/user")).toBe(false);
      expect.soft(isWithinBase("/var/log2/file.txt", "/var/log")).toBe(false);
    });

    it("should handle path normalization edge cases", () => {
      expect.soft(isWithinBase("/home/user/../user/documents/file.txt", "/home/user")).toBe(true);
      expect.soft(isWithinBase("/home/user/./documents/file.txt", "/home/user")).toBe(true);
      expect.soft(isWithinBase("/home/user/documents/../../other/file.txt", "/home/user")).toBe(false);
    });

    it("should handle same path comparison", () => {
      expect.soft(isWithinBase("/home/user", "/home/user")).toBe(true);
      expect.soft(isWithinBase("/var/www/html", "/var/www/html")).toBe(true);
    });

    it("should be case-sensitive on systems", () => {
      expect.soft(isWithinBase("/home/User/file.txt", "/home/user")).toBe(false);
      expect.soft(isWithinBase("/Home/user/file.txt", "/home/user")).toBe(false);
      expect.soft(isWithinBase("/var/Log/file.txt", "/var/log")).toBe(false);
    });
  });

  describe.runIf(isWindows)("windows specific", () => {
    it("should handle Windows drive letters correctly", () => {
      expect.soft(isWithinBase("C:\\Users\\John\\Documents\\file.txt", "C:\\Users\\John")).toBe(true);
      expect.soft(isWithinBase("C:\\Users\\Jane\\Documents\\file.txt", "C:\\Users\\John")).toBe(false);
      expect.soft(isWithinBase("D:\\Files\\document.txt", "C:\\Users\\John")).toBe(false);
    });

    it("should handle windows unc paths", () => {
      expect.soft(isWithinBase("\\\\server\\share\\folder\\file.txt", "\\\\server\\share")).toBe(true);
      expect.soft(isWithinBase("\\\\server\\share2\\file.txt", "\\\\server\\share")).toBe(false);
      expect.soft(isWithinBase("\\\\server2\\share\\file.txt", "\\\\server\\share")).toBe(false);
    });

    it("should prevent partial path matches", () => {
      expect.soft(isWithinBase("C:\\Users\\John2\\file.txt", "C:\\Users\\John")).toBe(false);
      expect.soft(isWithinBase("C:\\Users\\Johnathan\\file.txt", "C:\\Users\\John")).toBe(false);
    });

    it("should handle same path comparison", () => {
      expect.soft(isWithinBase("C:\\Users\\John", "C:\\Users\\John")).toBe(true);
      expect.soft(isWithinBase("\\\\server\\share", "\\\\server\\share")).toBe(true);
    });

    it("should be case insensitive on Windows systems", () => {
      expect.soft(isWithinBase("C:\\Users\\JOHN\\file.txt", "C:\\Users\\john")).toBe(true);
      expect.soft(isWithinBase("C:\\USERS\\John\\file.txt", "C:\\users\\john")).toBe(true);
      expect.soft(isWithinBase("D:\\Projects\\MyApp\\file.txt", "D:\\projects\\myapp")).toBe(true);
    });

    it("should handle Windows path normalization edge cases", () => {
      expect.soft(isWithinBase("C:\\Users\\John\\..\\John\\Documents\\file.txt", "C:\\Users\\John")).toBe(true);
      expect.soft(isWithinBase("C:\\Users\\John\\.\\Documents\\file.txt", "C:\\Users\\John")).toBe(true);
      expect.soft(isWithinBase("C:\\Users\\John\\Documents\\..\\..\\Jane\\file.txt", "C:\\Users\\John")).toBe(false);
    });
  });
});
