import { isWindows } from "#internal/test-utils";
import { describe, expect, it } from "vitest";
import {
  PathTraversalError,
  WindowsDriveMismatchError,
  WindowsPathBehaviorNotImplementedError,
  WindowsPathTypeMismatchError,
  WindowsUNCShareMismatchError,
} from "../src/errors";
import { internal_resolveWindowsPath, isWithinBase, resolveSafePath } from "../src/security";

describe.runIf(isWindows)("utils - windows", () => {
  describe("isWithinBase", () => {
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

    it("should handle windows path normalization edge cases", () => {
      expect.soft(isWithinBase("C:\\Users\\John\\..\\John\\Documents\\file.txt", "C:\\Users\\John")).toBe(true);
      expect.soft(isWithinBase("C:\\Users\\John\\.\\Documents\\file.txt", "C:\\Users\\John")).toBe(true);
      expect.soft(isWithinBase("C:\\Users\\John\\Documents\\..\\..\\Jane\\file.txt", "C:\\Users\\John")).toBe(false);
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
      it("should handle UNC paths within boundary", () => {
        const result = resolveSafePath("\\\\server\\share", "\\\\server\\share\\folder\\file.txt");
        expect(result).toBe("//server/share/folder/file.txt");
      });

      it("should throw error when mixing UNC paths with drive-letter base", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "\\\\server\\share\\file.txt");
        }).toThrowError(new WindowsPathTypeMismatchError("drive-letter", "UNC absolute"));
      });

      it("should throw error for UNC path difference", () => {
        expect(() => {
          resolveSafePath("\\\\server1\\share1", "\\\\server2\\share2\\file.txt");
        }).toThrowError(new PathTraversalError(
          "//server1/share1",
          "//server2/share2/file.txt",
        ));
      });

      it("should throw when UNC base and input are on different servers", () => {
        expect(() => {
          resolveSafePath("\\\\server1\\share", "\\\\server2\\share\\file.txt");
        }).toThrow(new PathTraversalError("//server1/share", "//server2/share"));
      });

      it("should resolve path within same UNC share without throwing", () => {
        expect(() => {
          resolveSafePath("\\\\server\\share", "\\\\server\\share\\dir\\file.txt");
        }).not.toThrow();
      });

      it("should prevent traversal outside UNC share using dot segments", () => {
        expect(() => {
          resolveSafePath("\\\\server\\share", "\\\\server\\share\\dir\\..\\..\\other\\file.txt");
        }).toThrow(PathTraversalError);
      });

      it("should normalize mixed slashes in UNC paths", () => {
        expect(() => {
          resolveSafePath("\\\\server\\share", "//server/share/dir\\sub\\file.txt");
        }).not.toThrow();
      });

      it("should treat different shares on same server as traversal", () => {
        expect(() => {
          resolveSafePath("\\\\server\\share1", "\\\\server\\share2\\file.txt");
        }).toThrow(new PathTraversalError("//server/share1", "//server/share2"));
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
          resolveSafePath("C:\\Users\\John\\Documents", "%2e%2e%5C%2e%2e%5CWindows%5CSystem32");
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
        }).toThrow("Invalid path format or contains illegal characters");
      });

      it("should handle Windows paths with control characters", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "file\x01.txt");
        }).toThrow("Invalid path format or contains illegal characters");
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

    // eslint-disable-next-line test/prefer-lowercase-title
    describe("UNC paths", () => {
      it("should resolve UNC paths with same share", () => {
        const result = internal_resolveWindowsPath("\\\\server\\share", "\\\\server\\share\\folder\\file.txt");
        expect(result).toBe("//server/share/folder/file.txt");
      });

      it("should throw WindowsUNCShareMismatchError for different shares", () => {
        expect(() => {
          internal_resolveWindowsPath("\\\\server1\\share1", "\\\\server2\\share2\\file.txt");
        }).toThrow(new WindowsUNCShareMismatchError("//server1/share1", "//server2/share2"));
      });

      it("should throw WindowsUNCShareMismatchError for different servers", () => {
        expect(() => {
          internal_resolveWindowsPath("\\\\server1\\share", "\\\\server2\\share\\file.txt");
        }).toThrow(new WindowsUNCShareMismatchError("//server1/share", "//server2/share"));
      });

      it("should handle UNC paths with different shares on same server", () => {
        expect(() => {
          internal_resolveWindowsPath("\\\\server\\share1", "\\\\server\\share2\\file.txt");
        }).toThrow(new WindowsUNCShareMismatchError("//server/share1", "//server/share2"));
      });
    });

    describe("mixed path types", () => {
      it("should throw WindowsPathTypeMismatchError when mixing UNC base with drive input", () => {
        expect(() => {
          internal_resolveWindowsPath("\\\\server\\share", "C:\\Users\\John\\file.txt");
        }).toThrow(new WindowsPathTypeMismatchError("UNC", "drive-letter absolute"));
      });

      it("should throw WindowsPathTypeMismatchError when mixing drive base with UNC input", () => {
        expect(() => {
          internal_resolveWindowsPath("C:\\Users\\John", "\\\\server\\share\\file.txt");
        }).toThrow(new WindowsPathTypeMismatchError("drive-letter", "UNC absolute"));
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
      it("should handle empty UNC tail paths", () => {
        const result = internal_resolveWindowsPath("\\\\server\\share", "\\\\server\\share");
        expect(result).toBe("//server/share");
      });

      it("should normalize backslashes to forward slashes in output", () => {
        const result = internal_resolveWindowsPath("C:\\Users\\John", "C:\\Users\\John\\Documents\\Projects\\file.txt");
        expect(result).toBe("C:/Users/John/Documents/Projects/file.txt");
      });

      it("should handle case insensitive UNC share comparison", () => {
        const result = internal_resolveWindowsPath("\\\\SERVER\\SHARE", "\\\\server\\share\\file.txt");
        expect(result).toBe("//SERVER/SHARE/file.txt");
      });
    });
  });
});
