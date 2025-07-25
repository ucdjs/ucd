import { generateAutoIndexHtml } from "apache-autoindex-parse/test-utils";
import { describe, expect, it } from "vitest";
import { parseUnicodeDirectory } from "../../src/lib/files";

describe("parseUnicodeDirectory", () => {
  it("should parse HTML directory listing", async () => {
    const mockHtml = generateAutoIndexHtml([
      { type: "directory", name: "15.1.0", path: "/15.1.0", lastModified: Date.now() },
      { type: "file", name: "UnicodeData.txt", path: "/UnicodeData.txt", lastModified: Date.now() },
    ], "F2");

    const result = await parseUnicodeDirectory(mockHtml);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      type: "directory",
      name: "15.1.0",
      path: "/15.1.0",
      lastModified: expect.any(Number),
    });
    expect(result[1]).toEqual({
      type: "file",
      name: "UnicodeData.txt",
      path: "/UnicodeData.txt",
      lastModified: expect.any(Number),
    });
  });

  it("should trim trailing slashes from names and paths", async () => {
    const mockHtml = generateAutoIndexHtml([
      { type: "directory", name: "folder/", path: "/folder/", lastModified: Date.now() },
    ], "F2");

    const result = await parseUnicodeDirectory(mockHtml);

    expect(result[0]!.name).toBe("folder");
    expect(result[0]!.path).toBe("/folder");
  });

  it("should return empty array when parsing fails", async () => {
    const invalidHtml = "<html><body>Invalid content</body></html>";

    const result = await parseUnicodeDirectory(invalidHtml);
    expect(result).toEqual([]);
  });
});
