import { describe, expect, it } from "vitest";
import { getWindowsDriveLetter, isUNCPath } from "../src/platform";

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
    expect.soft(isUNCPath("//server/share")).toBe(false);
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
