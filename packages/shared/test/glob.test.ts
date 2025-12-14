import { describe, expect, it } from "vitest";
import { createGlobMatcher, DEFAULT_PICOMATCH_OPTIONS, matchGlob } from "../src/glob";

describe("glob", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("DEFAULT_PICOMATCH_OPTIONS", () => {
    it("should have nocase set to true", () => {
      expect(DEFAULT_PICOMATCH_OPTIONS.nocase).toBe(true);
    });

    it("should have dot set to true", () => {
      expect(DEFAULT_PICOMATCH_OPTIONS.dot).toBe(true);
    });
  });

  describe("matchGlob", () => {
    it("should match exact filenames", () => {
      expect(matchGlob("file.txt", "file.txt")).toBe(true);
      expect(matchGlob("file.txt", "other.txt")).toBe(false);
    });

    it("should match extension patterns", () => {
      expect(matchGlob("*.txt", "file.txt")).toBe(true);
      expect(matchGlob("*.txt", "file.md")).toBe(false);
      expect(matchGlob("*.txt", "readme.txt")).toBe(true);
    });

    it("should match prefix patterns", () => {
      expect(matchGlob("Uni*", "UnicodeData.txt")).toBe(true);
      expect(matchGlob("Uni*", "Unihan.zip")).toBe(true);
      expect(matchGlob("Uni*", "Blocks.txt")).toBe(false);
    });

    it("should match suffix patterns", () => {
      expect(matchGlob("*Data.txt", "UnicodeData.txt")).toBe(true);
      expect(matchGlob("*Data.txt", "emoji-data.txt")).toBe(true); // case-insensitive: "data" matches "Data"
      expect(matchGlob("*Data.txt", "Blocks.txt")).toBe(false);
    });

    it("should match substring patterns", () => {
      expect(matchGlob("*Data*", "UnicodeData.txt")).toBe(true);
      expect(matchGlob("*Data*", "emoji-data.txt")).toBe(true);
      expect(matchGlob("*Data*", "Blocks.txt")).toBe(false);
    });

    it("should be case-insensitive by default", () => {
      expect(matchGlob("*.txt", "FILE.TXT")).toBe(true);
      expect(matchGlob("Uni*", "unicode.txt")).toBe(true);
      expect(matchGlob("unicode*", "UnicodeData.txt")).toBe(true);
    });

    it("should match multi-extension patterns with braces", () => {
      expect(matchGlob("*.{txt,xml}", "file.txt")).toBe(true);
      expect(matchGlob("*.{txt,xml}", "file.xml")).toBe(true);
      expect(matchGlob("*.{txt,xml}", "file.md")).toBe(false);
    });

    it("should match single character with ?", () => {
      expect(matchGlob("file?.txt", "file1.txt")).toBe(true);
      expect(matchGlob("file?.txt", "file2.txt")).toBe(true);
      expect(matchGlob("file?.txt", "file10.txt")).toBe(false);
    });

    it("should match character classes with []", () => {
      expect(matchGlob("file[123].txt", "file1.txt")).toBe(true);
      expect(matchGlob("file[123].txt", "file2.txt")).toBe(true);
      expect(matchGlob("file[123].txt", "file4.txt")).toBe(false);
    });

    it("should match dotfiles by default", () => {
      expect(matchGlob("*", ".gitignore")).toBe(true);
      expect(matchGlob(".*", ".gitignore")).toBe(true);
    });

    it("should allow case-sensitive matching via options", () => {
      expect(matchGlob("Uni*", "UnicodeData.txt", { nocase: false })).toBe(true);
      expect(matchGlob("Uni*", "unicodeData.txt", { nocase: false })).toBe(false);
    });

    it("should allow disabling dotfile matching via options", () => {
      expect(matchGlob("*", ".gitignore", { dot: false })).toBe(false);
      expect(matchGlob("*", "file.txt", { dot: false })).toBe(true);
    });
  });

  describe("createGlobMatcher", () => {
    it("should create a reusable matcher function", () => {
      const matcher = createGlobMatcher("*.txt");
      expect(matcher("file.txt")).toBe(true);
      expect(matcher("readme.txt")).toBe(true);
      expect(matcher("file.md")).toBe(false);
    });

    it("should be case-insensitive by default", () => {
      const matcher = createGlobMatcher("*.TXT");
      expect(matcher("file.txt")).toBe(true);
      expect(matcher("FILE.TXT")).toBe(true);
    });

    it("should work with Array.filter", () => {
      const files = ["a.txt", "b.md", "c.txt", "d.xml"];
      const txtFiles = files.filter(createGlobMatcher("*.txt"));
      expect(txtFiles).toEqual(["a.txt", "c.txt"]);
    });

    it("should work with complex patterns", () => {
      const matcher = createGlobMatcher("*Data*.{txt,xml}");
      expect(matcher("UnicodeData.txt")).toBe(true);
      expect(matcher("emoji-data.xml")).toBe(true);
      expect(matcher("Blocks.txt")).toBe(false);
    });

    it("should respect options", () => {
      const caseSensitiveMatcher = createGlobMatcher("Uni*", { nocase: false });
      expect(caseSensitiveMatcher("UnicodeData.txt")).toBe(true);
      expect(caseSensitiveMatcher("unicodedata.txt")).toBe(false);
    });
  });
});
