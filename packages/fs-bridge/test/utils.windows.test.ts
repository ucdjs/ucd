import { isWindows } from "#internal/test-utils";
import {
  BridgePathTraversal,
  BridgeWindowsDriveDifference,
  BridgeWindowsPathMismatch,
} from "@ucdjs/fs-bridge";
import { describe, expect, it } from "vitest";
import {
  getWindowsDriveLetter,
  getWindowsUNCRoot,
  resolveSafePath,
} from "../src/utils";

describe.runIf(isWindows)("utils - windows", () => {
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
        }).toThrowError(new BridgeWindowsDriveDifference(
          "C",
          "D",
        ));
      });

      it("should throw error for Windows paths with backslashes when drive letters differ", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "D:\\Windows\\System32\\file.dll");
        }).toThrowError(new BridgeWindowsDriveDifference(
          "C",
          "D",
        ));
      });

      it("should throw error for Windows paths with forward slashes when drive letters differ", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "D:/Projects/src/file.js");
        }).toThrowError(new BridgeWindowsDriveDifference(
          "C",
          "D",
        ));
      });

      it("should throw error for mixed case drive letters when they differ", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "d:\\temp\\file.txt");
        }).toThrowError(new BridgeWindowsDriveDifference(
          "C",
          "D",
        ));
      });

      it("should throw error for different drive letters", () => {
        expect(() => {
          resolveSafePath("C:\\Data", "E:\\External\\backup.zip");
        }).toThrowError(new BridgeWindowsDriveDifference(
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
        }).toThrowError(new BridgeWindowsPathMismatch("drive-letter", "UNC absolute"));
      });

      it("should throw error for UNC path difference", () => {
        expect(() => {
          resolveSafePath("\\\\server1\\share1", "\\\\server2\\share2\\file.txt");
        }).toThrowError(new BridgePathTraversal(
          "//server1/share1",
          "//server2/share2/file.txt",
        ));
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
        }).toThrowError(new BridgeWindowsDriveDifference(
          "C",
          "D",
        ));
      });

      it("should prevent encoded Windows directory traversal", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John\\Documents", "%2e%2e%5C%2e%2e%5CWindows%5CSystem32");
        }).toThrowError(new BridgePathTraversal(
          "C:/Users/John/Documents",
          "C:/Users/Windows/System32",
        ));
      });

      it("should handle multiple encoding layers", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "%252e%252e%255c%252e%252e%255cWindows");
        }).toThrowError(new BridgePathTraversal(
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
        }).toThrowError(new BridgePathTraversal(
          "C:/Users/John/Documents",
          "C:/Users/Windows/System32",
        ));
      });

      it("should prevent Windows directory traversal with mixed separators", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John\\Documents", "../..\\Windows/System32");
        }).toThrowError(new BridgePathTraversal(
          "C:/Users/John/Documents",
          "C:/Users/Windows/System32",
        ));
      });

      it("should prevent Windows encoded directory traversal", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John\\Documents", "%2e%2e%5c%2e%2e%5cWindows");
        }).toThrowError(new BridgePathTraversal(
          "C:/Users/John/Documents",
          "C:/Users/Windows",
        ));
      });

      it("should prevent traversal to different drives", () => {
        expect(() => {
          resolveSafePath("C:\\Users\\John", "..\\..\\..\\..\\D:\\sensitive");
        }).toThrowError(new BridgePathTraversal(
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

  describe("getWindowsDriveLetter", () => {
    it.each([
      { input: "C:\\path\\to\\file.txt", expected: "C" },
      { input: "D:\\another\\path\\to\\file.txt", expected: "D" },
      { input: "E:\\yet\\another\\path\\to\\file.txt", expected: "E" },
      { input: "C:\\path\\to\\another\\file.txt", expected: "C" },
      { input: "C:\\path\\to\\file.txt\\..\\..", expected: "C" },
      { input: "C:/path/to/file.txt", expected: "C" },
    ])("should extract drive letter from '$input'", ({ input, expected }) => {
      const result = getWindowsDriveLetter(input);
      expect(result).toBe(expected);
    });

    it.each([
      { input: "/path/to/file.txt", expected: null },
      { input: "relative\\path\\to\\file.txt", expected: null },
      { input: "\\\\server\\share\\path\\to\\file.txt", expected: null },
    ])("should not extract drive letter from '$input'", ({ input, expected }) => {
      const result = getWindowsDriveLetter(input);
      expect(result).toBe(expected);
    });
  });

  describe("getWindowsUNCRoot", () => {
    it.each([
      { input: "\\\\server\\share\\path\\to\\file.txt", expected: "\\\\server\\share" },
      { input: "\\\\another\\share\\path\\to\\file.txt", expected: "\\\\another\\share" },
      { input: "\\\\server\\share", expected: "\\\\server\\share" },
    ])("should extract UNC root from '$input'", ({ input, expected }) => {
      const result = getWindowsUNCRoot(input);
      expect(result).toBe(expected);
    });

    it.each([
      { input: "C:\\path\\to\\file.txt", expected: null },
      { input: "/path/to/file.txt", expected: null },
    ])("should not extract UNC root from '$input'", ({ input, expected }) => {
      const result = getWindowsUNCRoot(input);
      expect(result).toBe(expected);
    });
  });
});
