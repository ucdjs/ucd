import { describe, expect, it } from "vitest";
import {
  assertNotUNCPath,
  getWindowsDriveLetter,
  isUNCPath,
  isWindowsDrivePath,
  stripDriveLetter,
  toUnixFormat,
  UNCPathNotSupportedError,
} from "../src";

describe("getWindowsDriveLetter", () => {
  it("should return the uppercase drive letter for valid Windows paths", () => {
    expect.soft(getWindowsDriveLetter("C:")).toBe("C");
    expect.soft(getWindowsDriveLetter("c:")).toBe("C");
    expect.soft(getWindowsDriveLetter("D:\\path\\to\\file")).toBe("D");
    expect.soft(getWindowsDriveLetter("Z:somefile")).toBe("Z");
  });

  it("should return null for paths without drive letters", () => {
    expect.soft(getWindowsDriveLetter("path/to/file")).toBe(null);
    expect.soft(getWindowsDriveLetter("/unix/path")).toBe(null);
    expect.soft(getWindowsDriveLetter("relative\\path")).toBe(null);
  });

  it("should return null for invalid drive letters", () => {
    expect.soft(getWindowsDriveLetter("1:")).toBe(null);
    expect.soft(getWindowsDriveLetter("a1:")).toBe(null);
    expect.soft(getWindowsDriveLetter(":")).toBe(null);
    expect.soft(getWindowsDriveLetter(" :")).toBe(null);
  });

  it("should return null for empty string", () => {
    expect(getWindowsDriveLetter("")).toBe(null);
  });

  it("should not handle drive letters in the middle of the string", () => {
    expect.soft(getWindowsDriveLetter("prefixC:suffix")).toBe(null);
    expect.soft(getWindowsDriveLetter("someC:\\path")).toBe(null);
  });
});

describe("isWindowsDrivePath", () => {
  it("should return true for valid Windows drive paths", () => {
    expect.soft(isWindowsDrivePath("C:/")).toBe(true);
    expect.soft(isWindowsDrivePath("C:\\")).toBe(true);
    expect.soft(isWindowsDrivePath("D:/path/to/file")).toBe(true);
    expect.soft(isWindowsDrivePath("D:\\path\\to\\file")).toBe(true);
    expect.soft(isWindowsDrivePath("Z:/")).toBe(true);
    expect.soft(isWindowsDrivePath("Z:\\")).toBe(true);
  });

  it("should handle case insensitivity", () => {
    expect.soft(isWindowsDrivePath("c:/")).toBe(true);
    expect.soft(isWindowsDrivePath("c:\\")).toBe(true);
    expect.soft(isWindowsDrivePath("d:/file.txt")).toBe(true);
    expect.soft(isWindowsDrivePath("z:\\folder\\")).toBe(true);
  });

  it("should return false for paths without drive separators", () => {
    expect.soft(isWindowsDrivePath("C:")).toBe(false);
    expect.soft(isWindowsDrivePath("C:file.txt")).toBe(false);
    expect.soft(isWindowsDrivePath("D:folder")).toBe(false);
  });

  it("should return false for non-drive paths", () => {
    expect.soft(isWindowsDrivePath("/unix/path")).toBe(false);
    expect.soft(isWindowsDrivePath("relative/path")).toBe(false);
    expect.soft(isWindowsDrivePath("\\\\server\\share")).toBe(false);
    expect.soft(isWindowsDrivePath("file.txt")).toBe(false);
    expect.soft(isWindowsDrivePath("./current/dir")).toBe(false);
    expect.soft(isWindowsDrivePath("../parent/dir")).toBe(false);
  });

  it("should return false for invalid drive letters", () => {
    expect.soft(isWindowsDrivePath("1:/")).toBe(false);
    expect.soft(isWindowsDrivePath("1:\\")).toBe(false);
    expect.soft(isWindowsDrivePath(":/")).toBe(false);
    expect.soft(isWindowsDrivePath(":\\")).toBe(false);
    expect.soft(isWindowsDrivePath("123:/path")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isWindowsDrivePath("")).toBe(false);
  });

  it("should return false for paths with drive letters not at the start", () => {
    expect.soft(isWindowsDrivePath("prefixC:/suffix")).toBe(false);
    expect.soft(isWindowsDrivePath("someC:\\path")).toBe(false);
    expect.soft(isWindowsDrivePath("/pathC:/file")).toBe(false);
  });

  it("should handle special characters and spaces", () => {
    expect.soft(isWindowsDrivePath("C:/Program Files/")).toBe(true);
    expect.soft(isWindowsDrivePath("D:\\My Documents\\")).toBe(true);
    expect.soft(isWindowsDrivePath("E:/path with spaces/file.txt")).toBe(true);
  });
});

describe("stripDriveLetter", () => {
  it("should strip drive letters from Windows paths", () => {
    expect.soft(stripDriveLetter("C:/")).toBe("");
    expect.soft(stripDriveLetter("C:\\")).toBe("");
    expect.soft(stripDriveLetter("D:/path/to/file")).toBe("path/to/file");
    expect.soft(stripDriveLetter("D:\\path\\to\\file")).toBe("path\\to\\file");
    expect.soft(stripDriveLetter("Z:/folder/")).toBe("folder/");
    expect.soft(stripDriveLetter("Z:\\folder\\")).toBe("folder\\");
  });

  it("should handle case insensitivity", () => {
    expect.soft(stripDriveLetter("c:/")).toBe("");
    expect.soft(stripDriveLetter("c:\\")).toBe("");
    expect.soft(stripDriveLetter("d:/file.txt")).toBe("file.txt");
    expect.soft(stripDriveLetter("z:\\folder\\file")).toBe("folder\\file");
  });

  it("should return the original string for paths without drive letters", () => {
    expect.soft(stripDriveLetter("/unix/path")).toBe("/unix/path");
    expect.soft(stripDriveLetter("relative/path")).toBe("relative/path");
    expect.soft(stripDriveLetter("file.txt")).toBe("file.txt");
    expect.soft(stripDriveLetter("./current/dir")).toBe("./current/dir");
    expect.soft(stripDriveLetter("../parent/dir")).toBe("../parent/dir");
  });

  it("should throw UNCPathNotSupportedError for UNC paths", () => {
    expect.soft(() => stripDriveLetter("\\\\server\\share")).toThrow(UNCPathNotSupportedError);
    expect.soft(() => stripDriveLetter("//server/share")).toThrow(UNCPathNotSupportedError);
  });

  it("should not strip drive-like patterns without separators", () => {
    expect.soft(stripDriveLetter("C:")).toBe("C:");
    expect.soft(stripDriveLetter("C:file.txt")).toBe("C:file.txt");
    expect.soft(stripDriveLetter("D:folder")).toBe("D:folder");
  });

  it("should not strip invalid drive letters", () => {
    expect.soft(stripDriveLetter("1:/")).toBe("1:/");
    expect.soft(stripDriveLetter("1:\\")).toBe("1:\\");
    expect.soft(stripDriveLetter(":/")).toBe(":/");
    expect.soft(stripDriveLetter(":\\")).toBe(":\\");
    expect.soft(stripDriveLetter("123:/path")).toBe("123:/path");
  });

  it("should return empty string for empty input", () => {
    expect(stripDriveLetter("")).toBe("");
  });

  it("should not strip drive letters not at the start", () => {
    expect.soft(stripDriveLetter("prefixC:/suffix")).toBe("prefixC:/suffix");
    expect.soft(stripDriveLetter("someC:\\path")).toBe("someC:\\path");
    expect.soft(stripDriveLetter("/pathC:/file")).toBe("/pathC:/file");
  });

  it("should handle paths with special characters and spaces", () => {
    expect.soft(stripDriveLetter("C:/Program Files/")).toBe("Program Files/");
    expect.soft(stripDriveLetter("D:\\My Documents\\")).toBe("My Documents\\");
    expect.soft(stripDriveLetter("E:/path with spaces/file.txt")).toBe("path with spaces/file.txt");
  });

  it("should handle mixed separators after drive letter", () => {
    expect.soft(stripDriveLetter("C:/path\\mixed")).toBe("path\\mixed");
    expect.soft(stripDriveLetter("D:\\path/mixed")).toBe("path/mixed");
  });

  it("should throw TypeError for non-string inputs", () => {
    expect.soft(() => stripDriveLetter(null as any)).toThrow(TypeError);
    expect.soft(() => stripDriveLetter(undefined as any)).toThrow(TypeError);
    expect.soft(() => stripDriveLetter(123 as any)).toThrow(TypeError);
    expect.soft(() => stripDriveLetter({} as any)).toThrow(TypeError);
    expect.soft(() => stripDriveLetter([] as any)).toThrow(TypeError);
    expect.soft(() => stripDriveLetter(true as any)).toThrow(TypeError);
  });

  it("should throw TypeError with correct message", () => {
    expect.soft(() => stripDriveLetter(null as any)).toThrow("Path must be a string");
    expect.soft(() => stripDriveLetter(undefined as any)).toThrow("Path must be a string");
    expect.soft(() => stripDriveLetter(123 as any)).toThrow("Path must be a string");
  });
});

describe("isUNCPath", () => {
  it("should return true for valid UNC paths", () => {
    expect.soft(isUNCPath("\\\\server\\share")).toBe(true);
    expect.soft(isUNCPath("\\\\server\\share\\path\\to\\file")).toBe(true);
    expect.soft(isUNCPath("\\\\192.168.1.1\\share")).toBe(true);
    expect.soft(isUNCPath("\\\\localhost\\c$")).toBe(true);
  });

  it("should return false for non-absolute paths", () => {
    expect.soft(isUNCPath("server\\share")).toBe(false);
    expect.soft(isUNCPath("relative\\path")).toBe(false);
    expect.soft(isUNCPath("path/to/file")).toBe(false);
  });

  it("should return false for regular Windows drive paths", () => {
    expect.soft(isUNCPath("C:\\path\\to\\file")).toBe(false);
    expect.soft(isUNCPath("D:")).toBe(false);
  });

  it("should return false for Unix paths", () => {
    expect.soft(isUNCPath("/path/to/file")).toBe(false);
    // Note: //server/share is now considered a valid UNC path (forward-slash format)
    expect.soft(isUNCPath("//server/share")).toBe(true);
  });

  it("should return false for incomplete UNC paths", () => {
    expect.soft(isUNCPath("\\\\")).toBe(false);
    expect.soft(isUNCPath("\\\\server")).toBe(false);
    expect.soft(isUNCPath("\\\\server\\")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isUNCPath("")).toBe(false);
  });

  it("should return false for device namespaces and extended-length paths", () => {
    expect.soft(isUNCPath("\\\\.\\pipe\\mypipe")).toBe(false); // device namespace
    expect.soft(isUNCPath("\\\\?\\C:\\path")).toBe(false); // extended-length device path
    expect.soft(isUNCPath("\\\\?\\UNC\\server\\share\\file.txt")).toBe(false); // extended-length UNC form
  });
});

describe("toUnixFormat", () => {
  it("should convert Windows paths with backslashes to Unix format", () => {
    expect.soft(toUnixFormat("C:\\Windows\\System32")).toBe("/Windows/System32");
    expect.soft(toUnixFormat("D:\\path\\to\\file.txt")).toBe("/path/to/file.txt");
    expect.soft(toUnixFormat("\\server\\share\\file")).toBe("/server/share/file");
  });

  it("should handle mixed separators in Windows paths", () => {
    expect.soft(toUnixFormat("C:\\Windows/System32\\file.txt")).toBe("/Windows/System32/file.txt");
    expect.soft(toUnixFormat("D:/path\\to\\file")).toBe("/path/to/file");
    expect.soft(toUnixFormat("\\server/share\\file")).toBe("/server/share/file");
  });

  it("should strip Windows drive letters", () => {
    expect.soft(toUnixFormat("C:")).toBe("/");
    expect.soft(toUnixFormat("C:file.txt")).toBe("/file.txt");
    expect.soft(toUnixFormat("Z:\\deep\\nested\\path")).toBe("/deep/nested/path");
  });

  it("should handle Unix paths correctly", () => {
    expect.soft(toUnixFormat("/usr/bin/node")).toBe("/usr/bin/node");
    expect.soft(toUnixFormat("usr/bin/node")).toBe("/usr/bin/node");
    expect.soft(toUnixFormat("/home/user/.config")).toBe("/home/user/.config");
  });

  it("should handle relative paths", () => {
    expect.soft(toUnixFormat("relative/path")).toBe("/relative/path");
    expect.soft(toUnixFormat("file.txt")).toBe("/file.txt");
    expect.soft(toUnixFormat("./current/dir")).toBe("/current/dir");
  });

  it("should throw UNCPathNotSupportedError for UNC paths", () => {
    expect.soft(() => toUnixFormat("\\\\server\\share")).toThrow(UNCPathNotSupportedError);
    expect.soft(() => toUnixFormat("\\\\server\\share\\path")).toThrow(UNCPathNotSupportedError);
    expect.soft(() => toUnixFormat("//server/share/path")).toThrow(UNCPathNotSupportedError);
  });

  it("should handle empty strings and whitespace", () => {
    expect.soft(toUnixFormat("")).toBe("/");
    expect.soft(toUnixFormat("   ")).toBe("/");
  });

  it("should handle non-string inputs", () => {
    expect.soft(() => toUnixFormat(null as any)).toThrow(TypeError);
    expect.soft(() => toUnixFormat(undefined as any)).toThrow(TypeError);
    expect.soft(() => toUnixFormat(123 as any)).toThrow(TypeError);
    expect.soft(() => toUnixFormat({} as any)).toThrow(TypeError);
  });

  it("should handle paths with multiple consecutive separators", () => {
    expect.soft(toUnixFormat("C:\\\\path\\\\to\\\\file")).toBe("/path/to/file");
    expect.soft(toUnixFormat("path//to//file")).toBe("/path/to/file");
  });

  it("should handle special characters and Unicode", () => {
    expect.soft(toUnixFormat("C:\\Users\\José\\file.txt")).toBe("/Users/José/file.txt");
    expect.soft(toUnixFormat("path/with/特殊字符")).toBe("/path/with/特殊字符");
  });

  it("should handle drive letters in the middle of paths", () => {
    expect.soft(toUnixFormat("prefixC:suffix")).toBe("/prefixsuffix");
    expect.soft(toUnixFormat("someC:\\path")).toBe("/some/path");
  });

  it("should handle trailing separators", () => {
    expect.soft(toUnixFormat("C:\\folder\\")).toBe("/folder");
    expect.soft(toUnixFormat("relative/path/")).toBe("/relative/path");
  });

  it("should handle root paths", () => {
    expect.soft(toUnixFormat("C:\\")).toBe("/");
    expect.soft(toUnixFormat("\\")).toBe("/");
    expect.soft(toUnixFormat("/")).toBe("/");
  });

  it("should handle lowercase drive letters and spaces", () => {
    expect.soft(toUnixFormat("c:\\Program Files\\app")).toBe("/Program Files/app");
    expect.soft(toUnixFormat("D:\\My Documents\\file.txt")).toBe("/My Documents/file.txt");
  });

  it("should handle path traversal sequences", () => {
    expect.soft(toUnixFormat("C:\\folder\\..\\other")).toBe("/other");
    expect.soft(toUnixFormat("C:\\folder\\.\\file.txt")).toBe("/folder/file.txt");
    expect.soft(toUnixFormat("..\\parent\\file")).toBe("/parent/file");
    expect.soft(toUnixFormat(".\\current\\file")).toBe("/current/file");
  });

});

describe("assertNotUNCPath", () => {
  it("should not throw for non-UNC paths", () => {
    expect(() => assertNotUNCPath("C:\\Windows\\System32")).not.toThrow();
    expect(() => assertNotUNCPath("D:\\path\\to\\file")).not.toThrow();
    expect(() => assertNotUNCPath("/usr/local/bin")).not.toThrow();
    expect(() => assertNotUNCPath("relative/path")).not.toThrow();
    expect(() => assertNotUNCPath("file.txt")).not.toThrow();
  });

  it("should throw UNCPathNotSupportedError for UNC paths", () => {
    expect(() => assertNotUNCPath("\\\\server\\share")).toThrow(UNCPathNotSupportedError);
    expect(() => assertNotUNCPath("//server/share")).toThrow(UNCPathNotSupportedError);
    expect(() => assertNotUNCPath("\\\\192.168.1.100\\backup")).toThrow(UNCPathNotSupportedError);
  });
});
