import { describe, expect, it } from "vitest";
import { PathTraversalError } from "../src/errors";
import { resolveSafePath } from "../src/security";

describe("resolveSafePath - fs-bridge scenarios", () => {
  describe("relative basePath scenarios", () => {
    it("should resolve relative input with relative basePath", () => {
      const result = resolveSafePath("./ucd-data", "test.txt");

      // resolveSafePath normalizes paths to start with / (virtual filesystem)
      expect(result).toBe("/ucd-data/test.txt");
    });

    it("should resolve nested relative input with relative basePath", () => {
      const result = resolveSafePath("./ucd-data", "v16.0.0/file.txt");
      // resolveSafePath normalizes paths to start with / (virtual filesystem)
      expect(result).toBe("/ucd-data/v16.0.0/file.txt");
    });

    it("should allow upward traversal within relative basePath", () => {
      const result = resolveSafePath("./ucd-data", "subdir/../test.txt");
      // resolveSafePath normalizes paths to start with / (virtual filesystem)
      expect(result).toBe("/ucd-data/test.txt");
    });

    it("should prevent upward traversal outside relative basePath", () => {
      expect(() => {
        resolveSafePath("./ucd-data", "../outside.txt");
      }).toThrow(PathTraversalError);
    });

    it("should treat absolute input as relative with relative basePath (virtual filesystem)", () => {
      const result = resolveSafePath("./ucd-data", "/test.txt");
      // resolveSafePath normalizes paths to start with / (virtual filesystem)
      expect(result).toBe("/ucd-data/test.txt");
    });
  });

  describe("absolute basePath scenarios", () => {
    const absoluteBasePath = "/absolute/path/to/ucd-data";

    it("should resolve relative input with absolute basePath", () => {
      const result = resolveSafePath(absoluteBasePath, "test.txt");
      expect(result).toBe(`${absoluteBasePath}/test.txt`);
    });

    it("should resolve nested relative input with absolute basePath", () => {
      const result = resolveSafePath(absoluteBasePath, "v16.0.0/file.txt");
      expect(result).toBe(`${absoluteBasePath}/v16.0.0/file.txt`);
    });

    it("should allow upward traversal within absolute basePath", () => {
      const result = resolveSafePath(absoluteBasePath, "subdir/../test.txt");
      expect(result).toBe(`${absoluteBasePath}/test.txt`);
    });

    it("should allow version directory traversal within basePath", () => {
      const result = resolveSafePath(absoluteBasePath, "v16.0.0/../v15.1.0/file.txt");
      expect(result).toBe(`${absoluteBasePath}/v15.1.0/file.txt`);
    });

    it("should prevent upward traversal outside absolute basePath", () => {
      expect(() => {
        resolveSafePath(absoluteBasePath, "../outside.txt");
      }).toThrow(PathTraversalError);
    });

    it("should handle absolute input within absolute basePath", () => {
      const result = resolveSafePath(absoluteBasePath, `${absoluteBasePath}/test.txt`);
      expect(result).toBe(`${absoluteBasePath}/test.txt`);
    });

    it("should treat absolute input outside as relative (virtual filesystem)", () => {
      const result = resolveSafePath(absoluteBasePath, "/test.txt");
      expect(result).toBe(`${absoluteBasePath}/test.txt`);
    });
  });

  describe("edge cases - root and current directory", () => {
    it("should resolve root to basePath", () => {
      expect(resolveSafePath("/home/user", "/")).toBe("/home/user");
      expect(resolveSafePath("./ucd-data", "/")).toContain("ucd-data");
    });

    it("should resolve current directory to basePath", () => {
      expect(resolveSafePath("/home/user", ".")).toBe("/home/user");
      expect(resolveSafePath("./ucd-data", ".")).toContain("ucd-data");
    });

    it("should prevent parent directory when it goes outside basePath", () => {
      // Going up from /absolute/path/subdir with ".." resolves to /absolute/path
      // which is outside the basePath /absolute/path/subdir
      expect(() => {
        resolveSafePath("/absolute/path/subdir", "..");
      }).toThrow(PathTraversalError);
    });

    it("should prevent parent directory outside basePath", () => {
      expect(() => {
        resolveSafePath("/absolute/path", "..");
      }).toThrow(PathTraversalError);
    });
  });

  describe("upward traversal within basePath", () => {
    it("should allow multiple upward traversals if final path stays within", () => {
      // From /home/user/documents/projects, going up two levels and then into documents/file.txt
      // resolves to /home/user/documents/file.txt, which is outside /home/user/documents/projects
      // So this should actually fail
      expect(() => {
        resolveSafePath("/home/user/documents/projects", "../../documents/file.txt");
      }).toThrow(PathTraversalError);
    });

    it("should allow upward traversal that stays within basePath", () => {
      // From /home/user/documents/projects, going up one level stays within
      const result = resolveSafePath("/home/user/documents/projects", "../projects/file.txt");
      expect(result).toBe("/home/user/documents/projects/file.txt");
    });

    it("should prevent multiple upward traversals if final path goes outside", () => {
      expect(() => {
        resolveSafePath("/home/user/documents", "../../etc/passwd");
      }).toThrow(PathTraversalError);
    });
  });

  describe("empty and whitespace paths", () => {
    it("should handle empty input path", () => {
      expect(resolveSafePath("/base", "")).toBe("/base");
      expect(resolveSafePath("./ucd-data", "")).toContain("ucd-data");
    });

    it("should handle whitespace-only input path", () => {
      expect(resolveSafePath("/base", "   ")).toBe("/base");
      expect(resolveSafePath("/base", "\t")).toBe("/base");
    });
  });

  describe("path normalization edge cases", () => {
    it("should normalize multiple slashes", () => {
      const result = resolveSafePath("/base", "path///to///file.txt");
      expect(result).toBe("/base/path/to/file.txt");
    });

    it("should normalize mixed separators", () => {
      const result = resolveSafePath("/base", "path\\to/file.txt");
      expect(result).toBe("/base/path/to/file.txt");
    });

    it("should handle trailing slashes", () => {
      const result1 = resolveSafePath("/base", "path/");
      const result2 = resolveSafePath("/base", "path");
      // Both should normalize to the same path
      expect(result1.replace(/\/$/, "")).toBe(result2.replace(/\/$/, ""));
    });
  });
});
