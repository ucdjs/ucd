import { platform } from "node:os";
import { describe, expect, it } from "vitest";
import { isWithinBase, resolveSafePath } from "../src/utils";

describe.runIf(platform() === "win32")("utils - Windows specific", () => {
  describe("isWithinBase", () => {
    it("should handle Windows drive letters correctly", () => {
      expect(isWithinBase("C:\\Users\\John\\Documents\\file.txt", "C:\\Users\\John")).toBe(true);
      expect(isWithinBase("C:\\Users\\Jane\\Documents\\file.txt", "C:\\Users\\John")).toBe(false);
      expect(isWithinBase("D:\\Files\\document.txt", "C:\\Users\\John")).toBe(false);
    });

    it("should handle Windows UNC paths", () => {
      expect(isWithinBase("\\\\server\\share\\folder\\file.txt", "\\\\server\\share")).toBe(true);
      expect(isWithinBase("\\\\server\\share2\\file.txt", "\\\\server\\share")).toBe(false);
      expect(isWithinBase("\\\\server2\\share\\file.txt", "\\\\server\\share")).toBe(false);
    });

    it("should prevent partial Windows drive letter matches", () => {
      expect(isWithinBase("C:\\Users\\John2\\file.txt", "C:\\Users\\John")).toBe(false);
      expect(isWithinBase("C:\\Users\\Johnathan\\file.txt", "C:\\Users\\John")).toBe(false);
    });

    it("should handle Windows path normalization edge cases", () => {
      expect(isWithinBase("C:\\Users\\John\\..\\John\\Documents\\file.txt", "C:\\Users\\John")).toBe(true);
      expect(isWithinBase("C:\\Users\\John\\.\\Documents\\file.txt", "C:\\Users\\John")).toBe(true);
      expect(isWithinBase("C:\\Users\\John\\Documents\\..\\..\\Jane\\file.txt", "C:\\Users\\John")).toBe(false);
    });

    it("should handle same path comparison", () => {
      expect(isWithinBase("C:\\Users\\John", "C:\\Users\\John")).toBe(true);
      expect(isWithinBase("\\\\server\\share", "\\\\server\\share")).toBe(true);
    });
  });

  describe("resolveSafePath", () => {
    describe("windows absolute paths within boundary", () => {
      it("should allow Windows absolute paths within the base directory", () => {
        const result = resolveSafePath("C:\\Users\\John", "C:\\Users\\John\\Documents\\file.txt");
        expect(result).toBe("C:\\Users\\John\\Documents\\file.txt");
      });

      it("should handle Windows absolute paths within base directory", () => {
        const basePath = "C:\\Users\\john\\projects\\myapp";
        const inputPath = "C:\\Users\\john\\projects\\myapp\\hello.txt";

        expect.soft(resolveSafePath(basePath, inputPath)).toBe(inputPath);
      });

      it("should handle Windows paths with mixed separators", () => {
        const result = resolveSafePath("C:\\Users\\John", "C:/Users/John\\Documents/file.txt");
        expect(result).toBe("C:\\Users\\John\\Documents\\file.txt");
      });

      it("should allow exact boundary path match", () => {
        const result = resolveSafePath("C:\\Users\\John", "C:\\Users\\John");
        expect(result).toBe("C:\\Users\\John");
      });

      it("should handle nested Windows absolute paths within base", () => {
        expect.soft(
          resolveSafePath("C:\\Users\\John", "C:\\Users\\John\\Documents\\Projects\\file.txt"),
        ).toBe("C:\\Users\\John\\Documents\\Projects\\file.txt");
        expect.soft(
          resolveSafePath("D:\\Projects", "D:\\Projects\\myapp\\src\\index.js"),
        ).toBe("D:\\Projects\\myapp\\src\\index.js");
      });
    });

    describe("windows absolute paths outside boundary - drive letter stripping", () => {
      it("should strip drive letter from Windows absolute paths outside boundary", () => {
        const result = resolveSafePath("C:\\Users\\John\\Documents", "D:\\Projects\\file.txt");
        expect(result).toBe("C:\\Users\\John\\Documents\\Projects\\file.txt");
      });

      it("should handle Windows paths with backslashes after drive letter stripping", () => {
        const result = resolveSafePath("C:\\Users\\John", "D:\\Windows\\System32\\file.dll");
        expect(result).toBe("C:\\Users\\John\\Windows\\System32\\file.dll");
      });

      it("should handle Windows paths with forward slashes after drive letter stripping", () => {
        const result = resolveSafePath("C:\\Users\\John", "D:/Projects/src/file.js");
        expect(result).toBe("C:\\Users\\John\\Projects\\src\\file.js");
      });

      it("should handle mixed case drive letters", () => {
        const result = resolveSafePath("C:\\Users\\John", "d:\\temp\\file.txt");
        expect(result).toBe("C:\\Users\\John\\temp\\file.txt");
      });

      it("should handle different drive letters", () => {
        const result = resolveSafePath("C:\\Data", "E:\\External\\backup.zip");
        expect(result).toBe("C:\\Data\\External\\backup.zip");
      });
    });

    describe("windows UNC paths", () => {
      it("should handle UNC paths within boundary", () => {
        const result = resolveSafePath("\\\\server\\share", "\\\\server\\share\\folder\\file.txt");
        expect(result).toBe("\\\\server\\share\\folder\\file.txt");
      });

      it("should treat external UNC paths as relative after path conversion", () => {
        const result = resolveSafePath("C:\\Users\\John", "\\\\server\\share\\file.txt");
        expect(result).toBe("C:\\Users\\John\\server\\share\\file.txt");
      });

      it("should handle UNC path variations", () => {
        const result = resolveSafePath("\\\\server1\\share1", "\\\\server2\\share2\\file.txt");
        expect(result).toBe("\\\\server1\\share1\\server2\\share2\\file.txt");
      });
    });

    describe("windows encoded paths", () => {
      it("should decode and resolve Windows encoded paths", () => {
        const result = resolveSafePath("C:\\Users\\John", "Documents%5Cfile.txt");
        expect(result).toBe("C:\\Users\\John\\Documents\\file.txt");
      });

      it("should handle encoded Windows absolute paths outside boundary", () => {
        const result = resolveSafePath("C:\\Users\\John", "D%3A%5CProjects%5Cfile.txt");
        expect(result).toBe("C:\\Users\\John\\Projects\\file.txt");
      });

      it("should prevent encoded Windows directory traversal", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John\\Documents", "%2e%2e%5C%2e%2e%5CWindows%5CSystem32");
        }).toThrow("Path escapes boundary");
      });

      it("should handle multiple encoding layers", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "%252e%252e%255c%252e%252e%255cWindows");
        }).toThrow("Path escapes boundary");
      });
    });

    describe("windows virtual filesystem boundary", () => {
      it("should treat Windows root as boundary root", () => {
        const result = resolveSafePath("C:\\Users\\John", "/");
        expect(result).toBe("C:\\Users\\John");
      });

      it("should resolve Windows-style virtual paths relative to boundary", () => {
        const result = resolveSafePath("C:\\Users\\John", "/Documents/file.txt");
        expect(result).toBe("C:\\Users\\John\\Documents\\file.txt");
      });

      it("should handle current directory references", () => {
        const result1 = resolveSafePath("C:\\Users\\John", ".");
        expect(result1).toBe("C:\\Users\\John");

        const result2 = resolveSafePath("C:\\Users\\John", "./");
        expect(result2).toBe("C:\\Users\\John");
      });
    });

    describe("windows path traversal prevention", () => {
      it("should prevent Windows directory traversal with backslashes", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John\\Documents", "..\\..\\Windows\\System32");
        }).toThrow("Path escapes boundary");
      });

      it("should prevent Windows directory traversal with mixed separators", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John\\Documents", "../..\\Windows/System32");
        }).toThrow("Path escapes boundary");
      });

      it("should prevent Windows encoded directory traversal", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John\\Documents", "%2e%2e%5c%2e%2e%5cWindows");
        }).toThrow("Path escapes boundary");
      });

      it("should prevent traversal to different drives", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "..\\..\\..\\..\\D:\\sensitive");
        }).toThrow("Path escapes boundary");
      });
    });

    describe("windows relative paths", () => {
      it("should handle Windows relative paths with backslashes", () => {
        const result = resolveSafePath("C:\\Users\\John", "Documents\\Projects\\file.txt");
        expect(result).toBe("C:\\Users\\John\\Documents\\Projects\\file.txt");
      });

      it("should handle Windows relative paths with forward slashes", () => {
        const result = resolveSafePath("C:\\Users\\John", "Documents/Projects/file.txt");
        expect(result).toBe("C:\\Users\\John\\Documents\\Projects\\file.txt");
      });

      it("should handle mixed separators in relative paths", () => {
        const result = resolveSafePath("C:\\Users\\John", "Documents\\Projects/src/file.js");
        expect(result).toBe("C:\\Users\\John\\Documents\\Projects\\src\\file.js");
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
        expect(resolveSafePath("C:\\Users\\John", "")).toBe("C:\\Users\\John");
      });

      it("should handle malformed encoding", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "%gg%hh");
        }).toThrow();
      });
    });

    describe("windows path normalization output", () => {
      it("should return properly normalized Windows paths", () => {
        const result = resolveSafePath("C:\\Users\\John", "Documents\\..\\Documents\\file.txt");
        expect(result).toBe("C:\\Users\\John\\Documents\\file.txt");
      });

      it("should handle Windows long paths correctly", () => {
        const longPath = "very\\long\\path\\with\\many\\segments\\file.txt";
        const result = resolveSafePath("C:\\Users\\John", longPath);
        expect(result).toBe("C:\\Users\\John\\very\\long\\path\\with\\many\\segments\\file.txt");
      });

      it("should normalize redundant separators", () => {
        const result = resolveSafePath("C:\\Users\\John", "Documents\\\\\\Projects\\\\file.txt");
        expect(result).toBe("C:\\Users\\John\\Documents\\Projects\\file.txt");
      });
    });
  });
});
