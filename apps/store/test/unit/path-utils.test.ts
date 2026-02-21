import { hasUCDFolderPath } from "@unicode-utils/core";
import { describe, expect, it } from "vitest";
import {
  extractFilename,
  stripUCDPrefix,
  transformPathForUnicodeOrg,
} from "../../src/lib/path-utils";

describe("transformPathForUnicodeOrg", () => {
  it.each([
    { version: "17.0.0", file: "Blocks.txt", expected: "17.0.0/ucd/Blocks.txt" },
    { version: "16.0.0", file: "emoji/emoji-data.txt", expected: "16.0.0/ucd/emoji/emoji-data.txt" },
    { version: "6.0.0", file: "UnicodeData.txt", expected: "6.0.0/ucd/UnicodeData.txt" },
  ])("should add /ucd/ prefix for versions that need it: version=$version, file=$file", ({ version, file, expected }) => {
    expect(transformPathForUnicodeOrg(version, file)).toBe(expected);
  });

  it.each([
    { version: "5.2.0", file: "Blocks.txt" },
    { version: "4.0.1", file: "UnicodeData.txt" },
    { version: "1.0.0", file: "ReadMe.txt" },
  ])("should NOT add /ucd/ prefix for versions that don't need it: version=$version, file=$file", ({ version, file }) => {
    const expected = hasUCDFolderPath(version)
      ? `${version}/ucd/${file}`
      : `${version}/${file}`;
    expect(transformPathForUnicodeOrg(version, file)).toBe(expected);
  });

  it("should handle paths with leading slashes", () => {
    expect(transformPathForUnicodeOrg("17.0.0", "/Blocks.txt")).toBe("17.0.0/ucd/Blocks.txt");
    expect(transformPathForUnicodeOrg("17.0.0", "//emoji/data.txt")).toBe("17.0.0/ucd/emoji/data.txt");
  });

  it("should handle nested paths", () => {
    expect(transformPathForUnicodeOrg("17.0.0", "emoji/emoji-data.txt")).toBe("17.0.0/ucd/emoji/emoji-data.txt");
    expect(transformPathForUnicodeOrg("17.0.0", "auxiliary/GraphemeBreakProperty.txt")).toBe("17.0.0/ucd/auxiliary/GraphemeBreakProperty.txt");
  });
});

describe("stripUCDPrefix", () => {
  it("should remove /ucd/ from paths", () => {
    expect(stripUCDPrefix("/17.0.0/ucd/Blocks.txt")).toBe("/17.0.0/Blocks.txt");
    expect(stripUCDPrefix("/16.0.0/ucd/emoji/emoji-data.txt")).toBe("/16.0.0/emoji/emoji-data.txt");
  });

  it("should handle multiple /ucd/ occurrences", () => {
    expect(stripUCDPrefix("/ucd/ucd/test.txt")).toBe("/test.txt");
    expect(stripUCDPrefix("/17.0.0/ucd/emoji/ucd/test.txt")).toBe("/17.0.0/emoji/test.txt");
  });

  it("should return path unchanged if no /ucd/ present", () => {
    expect(stripUCDPrefix("/17.0.0/Blocks.txt")).toBe("/17.0.0/Blocks.txt");
    expect(stripUCDPrefix("/some/other/path")).toBe("/some/other/path");
  });

  it("should handle empty string", () => {
    expect(stripUCDPrefix("")).toBe("");
  });
});

describe("extractFilename", () => {
  it("should extract filename from manifest path", () => {
    expect(extractFilename("/17.0.0/ucd/Blocks.txt", "17.0.0")).toBe("Blocks.txt");
    expect(extractFilename("/16.0.0/ucd/emoji/emoji-data.txt", "16.0.0")).toBe("emoji/emoji-data.txt");
  });

  it("should handle paths without leading slash", () => {
    expect(extractFilename("17.0.0/ucd/Blocks.txt", "17.0.0")).toBe("Blocks.txt");
  });

  it("should handle paths without /ucd/ prefix", () => {
    expect(extractFilename("/17.0.0/Blocks.txt", "17.0.0")).toBe("Blocks.txt");
    expect(extractFilename("/4.0.1/UnicodeData.txt", "4.0.1")).toBe("UnicodeData.txt");
  });

  it("should handle nested paths", () => {
    expect(extractFilename("/17.0.0/ucd/auxiliary/GraphemeBreakProperty.txt", "17.0.0")).toBe("auxiliary/GraphemeBreakProperty.txt");
    expect(extractFilename("/17.0.0/ucd/emoji/emoji-data.txt", "17.0.0")).toBe("emoji/emoji-data.txt");
  });

  it("should return empty string for version-only path", () => {
    expect(extractFilename("/17.0.0/", "17.0.0")).toBe("");
    expect(extractFilename("17.0.0", "17.0.0")).toBe("17.0.0");
  });
});
