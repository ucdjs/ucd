import { isWindows } from "#internal/test-utils";
import { describe, expect, it } from "vitest";
import {
  PathTraversalError,
  UNCPathNotSupportedError,
  WindowsDriveMismatchError,
  WindowsPathBehaviorNotImplementedError,
} from "../src/errors";
import { internal_resolveWindowsPath, isWithinBase, resolveSafePath } from "../src/security";

describe.runIf(isWindows)("utils - windows", () => {
  describe("isWithinBase", () => {
    it("should handle Windows drive letters correctly", () => {
      expect.soft(isWithinBase("C:\\Users\\John", "C:\\Users\\John\\Documents\\file.txt")).toBe(true);
      expect.soft(isWithinBase("C:\\Users\\John", "C:\\Users\\Jane\\Documents\\file.txt")).toBe(false);
      expect.soft(isWithinBase("C:\\Users\\John", "D:\\Files\\document.txt")).toBe(false);
    });

    it("should throw UNCPathNotSupportedError for UNC paths", () => {
      expect(() => isWithinBase("\\\\server\\share", "\\\\server\\share\\folder\\file.txt")).toThrow(UNCPathNotSupportedError);
      expect(() => isWithinBase("\\\\server\\share", "\\\\server\\share2\\file.txt")).toThrow(UNCPathNotSupportedError);
      expect(() => isWithinBase("\\\\server\\share", "\\\\server2\\share\\file.txt")).toThrow(UNCPathNotSupportedError);
    });

    it("should prevent partial path matches", () => {
      expect.soft(isWithinBase("C:\\Users\\John", "C:\\Users\\John2\\file.txt")).toBe(false);
      expect.soft(isWithinBase("C:\\Users\\John", "C:\\Users\\Johnathan\\file.txt")).toBe(false);
    });

    it("should handle same path comparison", () => {
      expect.soft(isWithinBase("C:\\Users\\John", "C:\\Users\\John")).toBe(true);
    });

    it("should throw UNCPathNotSupportedError for UNC same path comparison", () => {
      expect(() => isWithinBase("\\\\server\\share", "\\\\server\\share")).toThrow(UNCPathNotSupportedError);
    });

    it("should handle windows path normalization edge cases", () => {
      expect.soft(isWithinBase("C:\\Users\\John", "C:\\Users\\John\\..\\John\\Documents\\file.txt")).toBe(true);
      expect.soft(isWithinBase("C:\\Users\\John", "C:\\Users\\John\\.\\Documents\\file.txt")).toBe(true);
      expect.soft(isWithinBase("C:\\Users\\John", "C:\\Users\\John\\Documents\\..\\..\\Jane\\file.txt")).toBe(false);
    });
  });

  describe("resolveSafePath", () => {
    describe("windows absolute paths within boundary", () => {
      it("should allow Windows absolute paths within the base directory", () => {
        const result = resolveSafePath("C:\\Users\\John", "C:\\Users\\John\\Documents\\file.txt");

        expect(result).toBe("C:/Users/John/Documents/file.txt");
      });

      it("should handle Windows absolute paths within base directory", () => {
        expect(
          resolveSafePath("C:\\Users\\john\\projects\\myapp", "C:\\Users\\john\\projects\\myapp\\hello.txt"),
        ).toBe("C:/Users/john/projects/myapp/hello.txt");
      });

      it("should handle Windows paths with mixed separators", () => {
        const result = resolveSafePath("C:\\Users\\John", "C:/Users/John\\Documents/file.txt");
        expect(result).toBe("C:/Users/John/Documents/file.txt");
      });

      it("should allow exact boundary path match", () => {
        const result = resolveSafePath("C:\\Users\\John", "C:\\Users\\John");
        expect(result).toBe("C:/Users/John");
      });

      it("should handle nested Windows absolute paths within base", () => {
        expect.soft(
          resolveSafePath("C:\\Users\\John", "C:\\Users\\John\\Documents\\Projects\\file.txt"),
        ).toBe("C:/Users/John/Documents/Projects/file.txt");
        expect.soft(
          resolveSafePath("D:\\Projects", "D:\\Projects\\myapp\\src\\index.js"),
        ).toBe("D:/Projects/myapp/src/index.js");
      });
    });

    describe("windows absolute paths outside boundary - drive letter mismatch", () => {
      it("should throw error for Windows absolute paths with different drive letters", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John\\Documents", "D:\\Projects\\file.txt");
        }).toThrowError(new WindowsDriveMismatchError(
          "C",
          "D",
        ));
      });

      it("should throw error for Windows paths with backslashes when drive letters differ", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "D:\\Windows\\System32\\file.dll");
        }).toThrowError(new WindowsDriveMismatchError(
          "C",
          "D",
        ));
      });

      it("should throw error for Windows paths with forward slashes when drive letters differ", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "D:/Projects/src/file.js");
        }).toThrowError(new WindowsDriveMismatchError(
          "C",
          "D",
        ));
      });

      it("should throw error for mixed case drive letters when they differ", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "d:\\temp\\file.txt");
        }).toThrowError(new WindowsDriveMismatchError(
          "C",
          "D",
        ));
      });

      it("should throw error for different drive letters", () => {
        expect(() => {
          resolveSafePath("C:\\Data", "E:\\External\\backup.zip");
        }).toThrowError(new WindowsDriveMismatchError(
          "C",
          "E",
        ));
      });
    });

    describe("windows UNC paths", () => {
      it("should throw UNCPathNotSupportedError for UNC base paths", () => {
        expect(() => {
          resolveSafePath("\\\\server\\share", "folder\\file.txt");
        }).toThrow(UNCPathNotSupportedError);
      });

      it("should throw UNCPathNotSupportedError for UNC input paths", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "\\\\server\\share\\file.txt");
        }).toThrow(UNCPathNotSupportedError);
      });

      it("should throw UNCPathNotSupportedError for both UNC base and input", () => {
        expect(() => {
          resolveSafePath("\\\\server1\\share1", "\\\\server2\\share2\\file.txt");
        }).toThrow(UNCPathNotSupportedError);
      });
    });

    describe("windows encoded paths", () => {
      it("should decode and resolve Windows encoded paths", () => {
        const result = resolveSafePath("C:\\Users\\John", "Documents%5Cfile.txt");
        expect(result).toBe("C:/Users/John/Documents/file.txt");
      });

      it("should handle encoded Windows absolute paths outside boundary", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "D%3A%5CProjects%5Cfile.txt");
        }).toThrowError(new WindowsDriveMismatchError(
          "C",
          "D",
        ));
      });

      it("should prevent encoded Windows directory traversal", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John\\Documents", "%2e%2e%5c%2e%2e%5cWindows%5CSystem32");
        }).toThrowError(new PathTraversalError(
          "C:/Users/John/Documents",
          "C:/Users/Windows/System32",
        ));
      });

      it("should handle multiple encoding layers", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "%252e%252e%255c%252e%252e%255cWindows");
        }).toThrowError(new PathTraversalError(
          "C:/Users/John",
          "C:/Windows",
        ));
      });
    });

    describe("windows virtual filesystem boundary", () => {
      it("should treat Windows root as boundary root", () => {
        const result = resolveSafePath("C:\\Users\\John", "/");
        expect(result).toBe("C:/Users/John");
      });

      it("should resolve Windows-style virtual paths relative to boundary", () => {
        const result = resolveSafePath("C:\\Users\\John", "/Documents/file.txt");
        expect(result).toBe("C:/Users/John/Documents/file.txt");
      });

      it("should handle current directory references", () => {
        const result1 = resolveSafePath("C:\\Users\\John", ".");
        expect(result1).toBe("C:/Users/John");

        const result2 = resolveSafePath("C:\\Users\\John", "./");
        expect(result2).toBe("C:/Users/John");
      });
    });

    describe("windows path traversal prevention", () => {
      it("should prevent Windows directory traversal with backslashes", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John\\Documents", "..\\..\\Windows\\System32");
        }).toThrowError(new PathTraversalError(
          "C:/Users/John/Documents",
          "C:/Users/Windows/System32",
        ));
      });

      it("should prevent Windows directory traversal with mixed separators", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John\\Documents", "../..\\Windows/System32");
        }).toThrowError(new PathTraversalError(
          "C:/Users/John/Documents",
          "C:/Users/Windows/System32",
        ));
      });

      it("should prevent Windows encoded directory traversal", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John\\Documents", "%2e%2e%5c%2e%2e%5cWindows");
        }).toThrowError(new PathTraversalError(
          "C:/Users/John/Documents",
          "C:/Users/Windows",
        ));
      });

      it("should prevent traversal to different drives", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "..\\..\\..\\..\\D:\\sensitive");
        }).toThrowError(new PathTraversalError(
          "C:/Users/John",
          "D:/sensitive",
        ));
      });
    });

    describe("windows relative paths", () => {
      it("should handle Windows relative paths with backslashes", () => {
        const result = resolveSafePath("C:\\Users\\John", "Documents\\Projects\\file.txt");
        expect(result).toBe("C:/Users/John/Documents/Projects/file.txt");
      });

      it("should handle Windows relative paths with forward slashes", () => {
        const result = resolveSafePath("C:\\Users\\John", "Documents/Projects/file.txt");
        expect(result).toBe("C:/Users/John/Documents/Projects/file.txt");
      });

      it("should handle mixed separators in relative paths", () => {
        const result = resolveSafePath("C:\\Users\\John", "Documents\\Projects/src/file.js");
        expect(result).toBe("C:/Users/John/Documents/Projects/src/file.js");
      });
    });

    describe("windows error cases", () => {
      it("should handle Windows paths with null bytes", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "file.txt\0.exe");
        }).toThrow(/Illegal character detected in path: '\0'/);
      });

      it("should handle Windows paths with control characters", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "file\x01.txt");
        // eslint-disable-next-line no-control-regex
        }).toThrow(/Illegal character detected in path: '\x01'/);
      });

      it("should handle empty input path", () => {
        expect(resolveSafePath("C:\\Users\\John", "")).toBe("C:/Users/John");
      });

      it("should handle malformed encoding", () => {
        expect.soft(resolveSafePath("C:\\Users\\John", "%E3%80%80")).toBe("C:/Users/John/　");
        expect.soft(resolveSafePath("C:\\Users\\John", "%ZZ")).toBe("C:/Users/John/%ZZ");
        expect.soft(resolveSafePath("C:\\Users\\John", "%gg%hh")).toBe("C:/Users/John/%gg%hh");
      });
    });

    describe("windows path normalization output", () => {
      it("should return properly normalized Windows paths", () => {
        const result = resolveSafePath("C:\\Users\\John", "Documents\\..\\Documents\\file.txt");
        expect(result).toBe("C:/Users/John/Documents/file.txt");
      });

      it("should handle Windows long paths correctly", () => {
        const longPath = "very\\long\\path\\with\\many\\segments\\file.txt";
        const result = resolveSafePath("C:\\Users\\John", longPath);
        expect(result).toBe("C:/Users/John/very/long/path/with/many/segments/file.txt");
      });

      it("should normalize redundant separators", () => {
        const result = resolveSafePath("C:\\Users\\John", "Documents\\\\\\Projects\\\\file.txt");
        expect(result).toBe("C:/Users/John/Documents/Projects/file.txt");
      });
    });
  });

  describe("internal_resolveWindowsPath", () => {
    describe("drive letter paths", () => {
      it("should resolve Windows drive paths with same drive letter", () => {
        const result = internal_resolveWindowsPath("C:\\Users\\John", "C:\\Users\\John\\Documents\\file.txt");
        expect(result).toBe("C:/Users/John/Documents/file.txt");
      });

      it("should handle drive paths with normalization", () => {
        const result = internal_resolveWindowsPath("C:\\Users\\John", "C:\\Users\\John\\Documents\\..\\Projects\\file.txt");
        expect(result).toBe("C:/Users/John/Projects/file.txt");
      });

      it("should throw WindowsDriveMismatchError for different drive letters", () => {
        expect(() => {
          internal_resolveWindowsPath("C:\\Users\\John", "D:\\Projects\\file.txt");
        }).toThrow(new WindowsDriveMismatchError("C", "D"));
      });

      it("should throw PathTraversalError for paths escaping base", () => {
        expect(() => {
          internal_resolveWindowsPath("C:\\Users\\John\\Documents", "C:\\Users\\Jane\\file.txt");
        }).toThrow(new PathTraversalError("C:/Users/John/Documents", "C:/Users/Jane/file.txt"));
      });

      it("should handle mixed case drive letters", () => {
        expect(() => {
          internal_resolveWindowsPath("C:\\Users\\John", "d:\\temp\\file.txt");
        }).toThrow(new WindowsDriveMismatchError("C", "D"));
      });
    });

    describe("unsupported scenarios", () => {
      it("should throw WindowsPathBehaviorNotImplementedError for unsupported combinations", () => {
        // Test with a scenario that doesn't match any of the implemented cases
        // This might be tricky to trigger, but let's try with malformed paths
        expect(() => {
          internal_resolveWindowsPath("/unix/path", "relative/path");
        }).toThrow(new WindowsPathBehaviorNotImplementedError());
      });
    });

    describe("edge cases", () => {
      it("should normalize backslashes to forward slashes in output", () => {
        const result = internal_resolveWindowsPath("C:\\Users\\John", "C:\\Users\\John\\Documents\\Projects\\file.txt");
        expect(result).toBe("C:/Users/John/Documents/Projects/file.txt");
      });
    });
  });
});
