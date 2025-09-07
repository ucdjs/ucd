import { describe, expect, it } from "vitest";
import {
  getAnyUNCRoot,
  getWindowsDriveLetter,
  isUNCPath,
  isWindowsDrivePath,
  stripDriveLetter,
  toUNCPosix,
  toUnixFormat,
} from "../src/platform";

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
    expect.soft(stripDriveLetter("\\\\server\\share")).toBe("\\\\server\\share");
    expect.soft(stripDriveLetter("file.txt")).toBe("file.txt");
    expect.soft(stripDriveLetter("./current/dir")).toBe("./current/dir");
    expect.soft(stripDriveLetter("../parent/dir")).toBe("../parent/dir");
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
    expect.soft(toUnixFormat("\\\\server\\\\share\\\\file")).toBe("//server/share/file");
  });

  it("should handle mixed separators in Windows paths", () => {
    expect.soft(toUnixFormat("C:\\Windows/System32\\file.txt")).toBe("/Windows/System32/file.txt");
    expect.soft(toUnixFormat("D:/path\\to\\file")).toBe("/path/to/file");
    expect.soft(toUnixFormat("\\server/share\\file")).toBe("/server/share/file");
    expect.soft(toUnixFormat("\\\\server\\share//file")).toBe("//server/share/file");
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

  it("should handle UNC paths", () => {
    expect.soft(toUnixFormat("\\\\server\\share")).toBe("//server/share");
    expect.soft(toUnixFormat("\\\\server\\share\\path")).toBe("//server/share/path");
    expect.soft(toUnixFormat("//server/share/path")).toBe("//server/share/path");
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
    expect.soft(toUnixFormat("//server//share//file")).toBe("//server/share/file");
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
    expect.soft(toUnixFormat("\\\\server\\share\\")).toBe("//server/share");
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

  it("should handle UNC edge cases", () => {
    expect.soft(toUnixFormat("\\\\192.168.1.100\\share\\file")).toBe("//192.168.1.100/share/file");
    expect.soft(toUnixFormat("\\\\server\\c$\\windows")).toBe("//server/c$/windows");
    expect.soft(toUnixFormat("\\\\server-name.domain.com\\share")).toBe("//server-name.domain.com/share");
  });
});

describe("getAnyUNCRoot", () => {
  it("should extract root from Windows UNC paths", () => {
    expect.soft(getAnyUNCRoot("\\\\server\\share")).toBe("//server/share");
    expect.soft(getAnyUNCRoot("\\\\server\\share\\")).toBe("//server/share");
    expect.soft(getAnyUNCRoot("\\\\server\\share\\path")).toBe("//server/share");
    expect.soft(getAnyUNCRoot("\\\\server\\share\\deep\\nested\\path")).toBe("//server/share");
    expect.soft(getAnyUNCRoot("\\\\fileserver\\documents\\folder\\file.txt")).toBe("//fileserver/documents");
  });

  it("should extract root from Unix UNC paths", () => {
    expect.soft(getAnyUNCRoot("//server/share")).toBe("//server/share");
    expect.soft(getAnyUNCRoot("//server/share/")).toBe("//server/share");
    expect.soft(getAnyUNCRoot("//server/share/path")).toBe("//server/share");
    expect.soft(getAnyUNCRoot("//server/share/deep/nested/path")).toBe("//server/share");
    expect.soft(getAnyUNCRoot("//fileserver/documents/folder/file.txt")).toBe("//fileserver/documents");
  });

  it("should handle mixed separators", () => {
    expect.soft(getAnyUNCRoot("\\\\server\\share/path")).toBe("//server/share");
    expect.soft(getAnyUNCRoot("\\\\server/share\\path")).toBe("//server/share");
    expect.soft(getAnyUNCRoot("//server\\share/path")).toBe("//server/share");
    expect.soft(getAnyUNCRoot("//server/share\\path")).toBe("//server/share");
  });

  it("should handle IP addresses as server names", () => {
    expect.soft(getAnyUNCRoot("\\\\192.168.1.100\\backup")).toBe("//192.168.1.100/backup");
    expect.soft(getAnyUNCRoot("//10.0.0.5/shared")).toBe("//10.0.0.5/shared");
    expect.soft(getAnyUNCRoot("\\\\127.0.0.1\\temp\\file.txt")).toBe("//127.0.0.1/temp");
  });

  it("should handle domain names and special characters", () => {
    expect.soft(getAnyUNCRoot("\\\\server.domain.com\\share")).toBe("//server.domain.com/share");
    expect.soft(getAnyUNCRoot("//file-server.company.org/public")).toBe("//file-server.company.org/public");
    expect.soft(getAnyUNCRoot("\\\\server_01\\share_name")).toBe("//server_01/share_name");
    expect.soft(getAnyUNCRoot("//server-2022/backup$")).toBe("//server-2022/backup$");
  });

  it("should return null for invalid inputs", () => {
    expect.soft(getAnyUNCRoot(null as any)).toBe(null);
    expect.soft(getAnyUNCRoot(undefined as any)).toBe(null);
    expect.soft(getAnyUNCRoot("")).toBe(null);
    expect.soft(getAnyUNCRoot("   ")).toBe(null);
  });

  it("should return null for strings that are too short", () => {
    expect.soft(getAnyUNCRoot("//")).toBe(null);
    expect.soft(getAnyUNCRoot("\\\\")).toBe(null);
    expect.soft(getAnyUNCRoot("//a")).toBe(null);
    expect.soft(getAnyUNCRoot("\\\\a")).toBe(null);
    expect.soft(getAnyUNCRoot("//a/")).toBe(null);
  });

  it("should return null for non-UNC paths", () => {
    expect.soft(getAnyUNCRoot("C:\\Windows\\System32")).toBe(null);
    expect.soft(getAnyUNCRoot("/usr/local/bin")).toBe(null);
    expect.soft(getAnyUNCRoot("relative/path")).toBe(null);
    expect.soft(getAnyUNCRoot("\\single\\backslash")).toBe(null);
    expect.soft(getAnyUNCRoot("/single/slash")).toBe(null);
    expect.soft(getAnyUNCRoot("file.txt")).toBe(null);
  });

  it("should return null for incomplete UNC paths", () => {
    expect.soft(getAnyUNCRoot("\\\\server")).toBe(null);
    expect.soft(getAnyUNCRoot("//server")).toBe(null);
    expect.soft(getAnyUNCRoot("\\\\server\\")).toBe(null);
    expect.soft(getAnyUNCRoot("//server/")).toBe(null);
    expect.soft(getAnyUNCRoot("\\\\\\share")).toBe(null);
    expect.soft(getAnyUNCRoot("///share")).toBe(null);
  });

  it("should handle minimum valid UNC paths", () => {
    expect.soft(getAnyUNCRoot("\\\\a\\b")).toBe("//a/b");
    expect.soft(getAnyUNCRoot("//a/b")).toBe("//a/b");
    expect.soft(getAnyUNCRoot("\\\\x\\y\\")).toBe("//x/y");
    expect.soft(getAnyUNCRoot("//x/y/")).toBe("//x/y");
  });

  it("should handle special characters in server and share names", () => {
    expect.soft(getAnyUNCRoot("\\\\server-01\\my_share")).toBe("//server-01/my_share");
    expect.soft(getAnyUNCRoot("//server.local/share$")).toBe("//server.local/share$");
    expect.soft(getAnyUNCRoot("\\\\file_server\\backup-2024")).toBe("//file_server/backup-2024");
  });

  it("should handle very long paths", () => {
    const longPath = "\\\\very-long-server-name.domain.company.com\\extremely-long-share-name\\very\\deep\\nested\\folder\\structure\\with\\many\\levels\\file.txt";
    expect(
      getAnyUNCRoot(longPath),
    ).toBe("//very-long-server-name.domain.company.com/extremely-long-share-name");
  });

  it("should return null for malformed UNC-like paths", () => {
    expect.soft(getAnyUNCRoot("\\\\server\\\\share")).toBe(null);
    expect.soft(getAnyUNCRoot("//server//share")).toBe(null);
    expect.soft(getAnyUNCRoot("\\\\server/\\share")).toBe(null);
    expect.soft(getAnyUNCRoot("\\\\\\server\\share")).toBe(null);
    expect.soft(getAnyUNCRoot("///server/share")).toBe(null);
  });

  it("should preserve case in server and share names", () => {
    expect.soft(getAnyUNCRoot("\\\\SERVER\\Share")).toBe("//SERVER/Share");
    expect.soft(getAnyUNCRoot("//FileServer/PublicShare")).toBe("//FileServer/PublicShare");
  });

  it("should handle paths with special suffixes", () => {
    expect.soft(getAnyUNCRoot("\\\\server\\share?param=value")).toBe("//server/share?param=value");
    expect.soft(getAnyUNCRoot("//server/share#anchor")).toBe("//server/share#anchor");
    expect.soft(getAnyUNCRoot("\\\\server\\share@version")).toBe("//server/share@version");
  });
});

describe("toUNCPosix", () => {
  it("should convert Windows UNC paths to POSIX format", () => {
    expect.soft(toUNCPosix("\\\\server\\share")).toBe("//server/share");
    expect.soft(toUNCPosix("\\\\server\\share\\")).toBe("//server/share");
    expect.soft(toUNCPosix("\\\\server\\share\\file")).toBe("//server/share/file");
    expect.soft(toUNCPosix("\\\\server\\share\\deep\\nested\\path")).toBe("//server/share/deep/nested/path");
    expect.soft(toUNCPosix("\\\\fileserver\\documents\\folder\\file.txt")).toBe("//fileserver/documents/folder/file.txt");
  });

  it("should pass through valid POSIX UNC paths", () => {
    expect.soft(toUNCPosix("//server/share")).toBe("//server/share");
    expect.soft(toUNCPosix("//server/share/")).toBe("//server/share");
    expect.soft(toUNCPosix("//server/share/file")).toBe("//server/share/file");
    expect.soft(toUNCPosix("//server/share/deep/nested/path")).toBe("//server/share/deep/nested/path");
    expect.soft(toUNCPosix("//fileserver/documents/folder/file.txt")).toBe("//fileserver/documents/folder/file.txt");
  });

  it("should handle mixed separators", () => {
    expect.soft(toUNCPosix("\\\\server\\share/path")).toBe("//server/share/path");
    expect.soft(toUNCPosix("\\\\server/share\\path")).toBe("//server/share/path");
    expect.soft(toUNCPosix("//server\\share/path")).toBe("//server/share/path");
    expect.soft(toUNCPosix("//server/share\\path")).toBe("//server/share/path");
  });

  it("should normalize malformed UNC paths", () => {
    expect.soft(toUNCPosix("\\\\\\server\\share")).toBe("//server/share");
    expect.soft(toUNCPosix("\\\\server\\\\share")).toBe("//server/share");
    expect.soft(toUNCPosix("///server/share")).toBe("//server/share");
    expect.soft(toUNCPosix("//server//share")).toBe("//server/share");
    expect.soft(toUNCPosix("\\\\server\\\\\\share\\\\file")).toBe("//server/share/file");
  });

  it("should handle IP addresses and special server names", () => {
    expect.soft(toUNCPosix("\\\\192.168.1.100\\backup")).toBe("//192.168.1.100/backup");
    expect.soft(toUNCPosix("//10.0.0.5/shared")).toBe("//10.0.0.5/shared");
    expect.soft(toUNCPosix("\\\\server.domain.com\\share")).toBe("//server.domain.com/share");
    expect.soft(toUNCPosix("\\\\file-server\\my_share")).toBe("//file-server/my_share");
    expect.soft(toUNCPosix("\\\\server01\\share$")).toBe("//server01/share$");
  });

  it("should return null for invalid inputs", () => {
    expect.soft(() => toUNCPosix(null as any)).toThrow(TypeError);
    expect.soft(() => toUNCPosix(undefined as any)).toThrow(TypeError);
    expect.soft(toUNCPosix("")).toBe(null);
    expect.soft(toUNCPosix("   ")).toBe(null);
  });

  it("should return null for non-UNC paths", () => {
    expect.soft(toUNCPosix("C:\\Windows\\System32")).toBe(null);
    expect.soft(toUNCPosix("D:\\path\\to\\file")).toBe(null);
    expect.soft(toUNCPosix("/usr/local/bin")).toBe(null);
    expect.soft(toUNCPosix("relative/path")).toBe(null);
    expect.soft(toUNCPosix("\\single\\backslash")).toBe(null);
    expect.soft(toUNCPosix("/single/slash")).toBe(null);
    expect.soft(toUNCPosix("file.txt")).toBe(null);
  });

  it("should return null for incomplete UNC paths", () => {
    expect.soft(toUNCPosix("\\\\")).toBe(null);
    expect.soft(toUNCPosix("//")).toBe(null);
    expect.soft(toUNCPosix("\\\\server")).toBe(null);
    expect.soft(toUNCPosix("//server")).toBe(null);
    expect.soft(toUNCPosix("\\\\server\\")).toBe(null);
    expect.soft(toUNCPosix("//server/")).toBe(null);
    expect.soft(toUNCPosix("\\\\\\share")).toBe(null);
    expect.soft(toUNCPosix("///share")).toBe(null);
  });

  it("should handle minimum valid UNC paths", () => {
    expect.soft(toUNCPosix("\\\\a\\b")).toBe("//a/b");
    expect.soft(toUNCPosix("//a/b")).toBe("//a/b");
    expect.soft(toUNCPosix("\\\\x\\y\\")).toBe("//x/y");
    expect.soft(toUNCPosix("//x/y/")).toBe("//x/y");
  });

  it("should handle whitespace correctly", () => {
    expect.soft(toUNCPosix("  \\\\server\\share  ")).toBe("//server/share");
    expect.soft(toUNCPosix("  //server/share  ")).toBe("//server/share");
    expect.soft(toUNCPosix("\\\\server name\\share name")).toBe("//server name/share name");
  });

  it("should preserve special characters", () => {
    expect.soft(toUNCPosix("\\\\server\\share with spaces")).toBe("//server/share with spaces");
    expect.soft(toUNCPosix("\\\\server\\share-with-dashes")).toBe("//server/share-with-dashes");
    expect.soft(toUNCPosix("\\\\server\\share_with_underscores")).toBe("//server/share_with_underscores");
    expect.soft(toUNCPosix("\\\\server\\share$")).toBe("//server/share$");
    expect.soft(toUNCPosix("\\\\server\\c$\\windows")).toBe("//server/c$/windows");
  });

  it("should handle very long paths", () => {
    const longPath = "\\\\very-long-server-name.domain.company.com\\extremely-long-share-name\\very\\deep\\nested\\folder\\structure\\with\\many\\levels\\and\\a\\very\\long\\filename.txt";
    const expected = "//very-long-server-name.domain.company.com/extremely-long-share-name/very/deep/nested/folder/structure/with/many/levels/and/a/very/long/filename.txt";
    expect(toUNCPosix(longPath)).toBe(expected);
  });

  it("should preserve case in server and share names", () => {
    expect.soft(toUNCPosix("\\\\SERVER\\Share")).toBe("//SERVER/Share");
    expect.soft(toUNCPosix("\\\\FileServer\\PublicShare")).toBe("//FileServer/PublicShare");
    expect.soft(toUNCPosix("//MixedCase/ShareName")).toBe("//MixedCase/ShareName");
  });

  it("should handle trailing separators consistently", () => {
    expect.soft(toUNCPosix("\\\\server\\share\\")).toBe("//server/share");
    expect.soft(toUNCPosix("\\\\server\\share\\\\")).toBe("//server/share");
    expect.soft(toUNCPosix("//server/share/")).toBe("//server/share");
    expect.soft(toUNCPosix("//server/share//")).toBe("//server/share");
  });
});
