import { describe, expect, it } from "vitest";
import { resolveSafePath } from "../src/utils";

describe("resolveSafePath", () => {
  const basePath = "/safe/base/path";

  it.each([
    ["file.txt", "/safe/base/path/file.txt"],
    ["folder/file.txt", "/safe/base/path/folder/file.txt"],
    ["a/b/c/d/file.txt", "/safe/base/path/a/b/c/d/file.txt"],
    ["./file.txt", "/safe/base/path/file.txt"],
    ["folder//file.txt", "/safe/base/path/folder/file.txt"],
    ["/file.txt", "/safe/base/path/file.txt"],
    ["/folder/file.txt", "/safe/base/path/folder/file.txt"],
    ["/folder//file.txt", "/safe/base/path/folder/file.txt"],
    ["/./folder/file.txt", "/safe/base/path/folder/file.txt"],
    ["", "/safe/base/path"],
    [".", "/safe/base/path"],
    ["/.", "/safe/base/path"],
    ["folder/../file.txt", "/safe/base/path/file.txt"],
    ["a/b/../c/./d/file.txt", "/safe/base/path/a/c/d/file.txt"],
  ])("should resolve path '%s' to '%s'", (inputPath, expected) => {
    const result = resolveSafePath(basePath, inputPath);
    expect(result).toBe(expected);
  });

  it.each([
    "../outside.txt",
    "../../outside.txt",
    "folder/../../../outside.txt",
    "/../outside.txt",
    "/folder/../../outside.txt",
    "../../../",
  ])("should reject traversal path '%s'", (inputPath) => {
    expect(() => resolveSafePath(basePath, inputPath))
      .toThrow("Path traversal detected");
  });

  it.each([
    "file.txt\0",
    "../outside.txt\0",
    "file\x0A.txt",
    "file\x0D.txt",
  ])("should reject dangerous control characters in '%s'", (inputPath) => {
    expect(() => resolveSafePath(basePath, inputPath))
      .toThrow("Path contains dangerous control characters");
  });

  describe("base path variations", () => {
    it("should work with relative base paths", () => {
      const result = resolveSafePath("relative/base", "file.txt");
      expect(result).toContain("file.txt");
      expect(result).toContain("relative/base");
    });

    it("should work with base paths containing spaces", () => {
      const baseWithSpaces = "/path with spaces/base";
      const result = resolveSafePath(baseWithSpaces, "file.txt");
      expect(result).toBe("/path with spaces/base/file.txt");
    });

    it("should normalize base path", () => {
      const unnormalizedBase = "/path//with//double//slashes";
      const result = resolveSafePath(unnormalizedBase, "file.txt");
      expect(result).toBe("/path/with/double/slashes/file.txt");
    });
  });

  describe("path combinations", () => {
    describe("relative base + relative path", () => {
      it("should resolve both relative paths correctly", () => {
        const result = resolveSafePath("relative/base", "sub/file.txt");
        expect(result).toMatch(/.*relative\/base\/sub\/file\.txt$/);
      });

      it("should handle traversal attempts with relative base", () => {
        expect(() => resolveSafePath("relative/base", "../../../outside.txt"))
          .toThrow("Path traversal detected");
      });

      it("should allow safe navigation within relative base", () => {
        const result = resolveSafePath("relative/base", "sub/../file.txt");
        expect(result).toMatch(/.*relative\/base\/file\.txt$/);
      });
    });

    describe("relative base + absolute path", () => {
      it("should treat absolute path as relative to base", () => {
        const result = resolveSafePath("relative/base", "/file.txt");
        expect(result).toMatch(/.*relative\/base\/file\.txt$/);
      });

      it("should handle absolute path with subdirectories", () => {
        const result = resolveSafePath("relative/base", "/sub/file.txt");
        expect(result).toMatch(/.*relative\/base\/sub\/file\.txt$/);
      });

      it("should prevent traversal with absolute paths on relative base", () => {
        expect(() => resolveSafePath("./relative/base", "/../outside.txt"))
          .toThrow("Path traversal detected");
      });

      it("should handle complex absolute paths with relative base", () => {
        const result = resolveSafePath("relative/base", "/sub/../file.txt");
        expect(result).toMatch(/.*relative\/base\/file\.txt$/);
      });
    });

    describe("absolute base + absolute path", () => {
      it("should treat absolute path as relative to absolute base", () => {
        const result = resolveSafePath("/absolute/base", "/file.txt");
        expect(result).toBe("/absolute/base/file.txt");
      });

      it("should handle nested absolute paths", () => {
        const result = resolveSafePath("/absolute/base", "/sub/deep/file.txt");
        expect(result).toBe("/absolute/base/sub/deep/file.txt");
      });

      it("should reject traversal attempts with both absolute", () => {
        expect(() => resolveSafePath("/absolute/base", "/../outside.txt"))
          .toThrow("Path traversal detected");
      });

      it("should handle complex navigation with both absolute", () => {
        const result = resolveSafePath("/absolute/base", "/sub/../file.txt");
        expect(result).toBe("/absolute/base/file.txt");
      });
    });
  });

  it.each([
    ["%2e%2e%2foutside.txt", "URL encoded dot-dot-slash"],
    ["%2e%2e%2f%2e%2e%2foutside.txt", "URL encoded double dot-dot-slash"],
    ["\u002E\u002E/outside.txt", "Unicode encoded traversal"],
  ])("should reject encoded traversal: %s (%s)", (inputPath) => {
    expect(() => resolveSafePath("/base", inputPath))
      .toThrow("Path traversal detected");
  });

  it("should reject CRLF injection with control character error", () => {
    // CRLF injection contains control characters, so it's caught by that check first
    expect(() => resolveSafePath("/base", "../outside.txt\r\n"))
      .toThrow("Path contains dangerous control characters");
  });

  it.each([
    "../outside.txt\0",
  ])("should reject null byte injection: %s", (inputPath) => {
    expect(() => resolveSafePath("/base", inputPath))
      .toThrow();
  });

  it.each([
    ["/", "file.txt", "/file.txt"],
    ["/base", "folder\\file.txt", "/base/folder\\file.txt"],
    ["/base", "folder/sub\\file.txt", "/base/folder/sub\\file.txt"],
  ])("should handle edge cases: base='%s', path='%s' -> '%s'", (base, inputPath, expected) => {
    const result = resolveSafePath(base, inputPath);
    expect(result).toBe(expected);
  });

  it.each([
    "../../../../../../../",
    "../outside.txt",
  ])("should reject edge case traversal: '%s'", (inputPath) => {
    expect(() => resolveSafePath("/base", inputPath))
      .toThrow("Path traversal detected");
  });

  it("should handle very long paths", () => {
    const longPath = `${"a/".repeat(100)}file.txt`;
    const result = resolveSafePath("/base", longPath);
    expect(result).toMatch(/^\/base\/a(\/a)*\/file\.txt$/);
  });

  describe("absolute paths within base path", () => {
    it("should handle absolute path that's already within base", () => {
      const basePath = "/Users/test/project";
      const inputPath = "/Users/test/project/src/file.txt";
      const result = resolveSafePath(basePath, inputPath);
      expect(result).toBe("/Users/test/project/src/file.txt");
    });

    it("should handle absolute path that equals base path", () => {
      const basePath = "/Users/test/project";
      const inputPath = "/Users/test/project";
      const result = resolveSafePath(basePath, inputPath);
      expect(result).toBe("/Users/test/project");
    });

    it("should handle absolute path with nested structure within base", () => {
      const basePath = "/Users/test/project";
      const inputPath = "/Users/test/project/deep/nested/file.txt";
      const result = resolveSafePath(basePath, inputPath);
      expect(result).toBe("/Users/test/project/deep/nested/file.txt");
    });

    it("should handle long test directory paths", () => {
      const basePath = "/tmp/test-project/.vitest-testdirs/test-configuration-long-directory-name";
      const inputPath = "/tmp/test-project/.vitest-testdirs/test-configuration-long-directory-name/.config.json";
      const result = resolveSafePath(basePath, inputPath);
      expect(result).toBe("/tmp/test-project/.vitest-testdirs/test-configuration-long-directory-name/.config.json");
    });

    it("should still treat absolute paths outside base as relative to base", () => {
      const basePath = "/Users/test/project";
      const inputPath = "/etc/passwd";
      const result = resolveSafePath(basePath, inputPath);
      expect(result).toBe("/Users/test/project/etc/passwd");
    });
  });

  describe("root base path behavior", () => {
    it("should allow access to filesystem paths when base is root (expected behavior)", () => {
      // When base path is "/", the user has intentionally given access to entire filesystem
      // This is NOT a vulnerability - it's the expected behavior when someone chooses "/" as base

      const systemPaths = [
        "/etc/passwd",
        "/var/log/system.log",
        "/home/user/.ssh/id_rsa",
        "/tmp/file.txt",
      ];

      for (const path of systemPaths) {
        // This should PASS because user chose "/" as base - they want filesystem access
        const result = resolveSafePath("/", path);
        expect(result).toBe(path);
      }
    });

    it("should handle traversal attempts with root base (resolves within root)", () => {
      // With root base, "/../outside.txt" actually resolves to "/outside.txt" which is valid
      // You cannot escape above root directory, so this is safe behavior
      const result = resolveSafePath("/", "/../outside.txt");
      expect(result).toBe("/outside.txt");
    });

    it.each([
      ["", "/"],
      [".", "/"],
      ["/", "/"],
      ["etc/passwd", "/etc/passwd"],
      ["/etc/passwd", "/etc/passwd"],
    ])("should resolve root-relative paths: input='%s' -> expected='%s'", (input, expected) => {
      const result = resolveSafePath("/", input);
      expect(result).toBe(expected);
    });
  });
});
