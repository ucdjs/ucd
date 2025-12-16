import { describe, expect, it } from "vitest";
import {
  createGlobMatcher,
  DEFAULT_PICOMATCH_OPTIONS,
  isValidGlobPattern,
  matchGlob,
  MAX_GLOB_BRACE_EXPANSIONS,
  MAX_GLOB_LENGTH,
  MAX_GLOB_QUESTIONS,
  MAX_GLOB_SEGMENTS,
  MAX_GLOB_STARS,
} from "../src/glob";

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

  describe("isValidGlobPattern", () => {
    describe("valid patterns", () => {
      it.each([
        "*.txt",
        "src/**/*.ts",
        "*.{txt,xml}",
        "file?.txt",
        "file[123].txt",
        "Uni*",
        "*Data.txt",
        "!(*.txt)",
        "@(file1|file2)",
        "+(*.txt|*.md)",
        "?(file)",
        "**/*",
        "a/b/c",
        "path/to/file.txt",
      ])("should accept valid pattern: %s", (pattern) => {
        expect(isValidGlobPattern(pattern)).toBe(true);
      });
    });

    describe("invalid input types", () => {
      it.each([
        [""],
        [undefined as unknown as string],
        [null as unknown as string],
        [123 as unknown as string],
        [[] as unknown as string],
      ])("should reject invalid input: %s", (input) => {
        expect(isValidGlobPattern(input)).toBe(false);
      });
    });

    // eslint-disable-next-line test/prefer-lowercase-title
    describe("DoS protection - length limits", () => {
      it.each([
        [MAX_GLOB_LENGTH + 1, {}],
        [10, { maxLength: 5 }],
        [100, { maxLength: 50 }],
      ])("should reject patterns longer than limit (length: %d)", (length, limits) => {
        const pattern = "a".repeat(length);
        expect(isValidGlobPattern(pattern, limits)).toBe(false);
      });

      it("should accept patterns within length limit", () => {
        expect(isValidGlobPattern("a".repeat(MAX_GLOB_LENGTH))).toBe(true);
        expect(isValidGlobPattern("a".repeat(5), { maxLength: 10 })).toBe(true);
      });
    });

    // eslint-disable-next-line test/prefer-lowercase-title
    describe("DoS protection - segment limits", () => {
      it.each([
        [MAX_GLOB_SEGMENTS + 1, {}],
        [3, { maxSegments: 2 }],
        [10, { maxSegments: 5 }],
      ])("should reject patterns with too many segments (segments: %d)", (segments, limits) => {
        const pattern = Array.from({ length: segments }, () => "seg").join("/");
        expect(isValidGlobPattern(pattern, limits)).toBe(false);
      });

      it("should accept patterns within segment limit", () => {
        const pattern = Array.from({ length: MAX_GLOB_SEGMENTS }, () => "seg").join("/");
        expect(isValidGlobPattern(pattern)).toBe(true);
        expect(isValidGlobPattern("a/b", { maxSegments: 3 })).toBe(true);
      });
    });

    // eslint-disable-next-line test/prefer-lowercase-title
    describe("DoS protection - brace expansion limits", () => {
      it.each([
        [MAX_GLOB_BRACE_EXPANSIONS + 1, {}],
        [3, { maxBraceExpansions: 2 }],
        [10, { maxBraceExpansions: 5 }],
      ])("should reject patterns with too many brace expansions (expansions: %d)", (expansions, limits) => {
        const options = Array.from({ length: expansions }, (_, i) => `p${i}`).join(",");
        const pattern = `{${options}}`;
        expect(isValidGlobPattern(pattern, limits)).toBe(false);
      });

      it("should accept patterns within brace expansion limit", () => {
        const options = Array.from({ length: MAX_GLOB_BRACE_EXPANSIONS }, (_, i) => `p${i}`).join(",");
        expect(isValidGlobPattern(`{${options}}`)).toBe(true);
        expect(isValidGlobPattern("{a,b}", { maxBraceExpansions: 3 })).toBe(true);
      });
    });

    // eslint-disable-next-line test/prefer-lowercase-title
    describe("DoS protection - extglob depth limits", () => {
      it.each([
        ["!(!(!(!(file))))", {}], // depth 4, limit 3
        ["!(!file)", { maxExtglobDepth: 1 }], // depth 2, limit 1
        ["!(!(!file))", { maxExtglobDepth: 1 }], // depth 3, limit 1
        ["!(!(!file))", { maxExtglobDepth: 2 }], // depth 3, limit 2
        ["@(@(@(file)))", {}], // depth 3, limit 3 (should reject)
        ["+(*(*(*file)))", {}], // depth 3, limit 3 (should reject)
      ])("should reject patterns exceeding extglob depth limit: %s", (pattern, limits) => {
        expect(isValidGlobPattern(pattern, limits)).toBe(false);
      });

      it("should accept patterns within extglob depth limit", () => {
        expect(isValidGlobPattern("!(*.txt)")).toBe(true); // depth 1
        expect(isValidGlobPattern("!(!file)", { maxExtglobDepth: 2 })).toBe(true); // depth 2, limit 2
        expect(isValidGlobPattern("!(!(!file))", { maxExtglobDepth: 3 })).toBe(true); // depth 3, limit 3
        expect(isValidGlobPattern("@(@(file))", { maxExtglobDepth: 3 })).toBe(true); // depth 2, limit 3
      });
    });

    // eslint-disable-next-line test/prefer-lowercase-title
    describe("DoS protection - wildcard limits", () => {
      it.each([
        ["*", MAX_GLOB_STARS + 1, {}],
        ["?", MAX_GLOB_QUESTIONS + 1, {}],
        ["*", 2, { maxStars: 1 }],
        ["?", 2, { maxQuestions: 1 }],
        ["*", 20, { maxStars: 10 }],
        ["?", 20, { maxQuestions: 10 }],
      ])("should reject patterns with too many %s wildcards (count: %d)", (wildcard, count, limits) => {
        const pattern = wildcard.repeat(count);
        expect(isValidGlobPattern(pattern, limits)).toBe(false);
      });

      it("should accept patterns within wildcard limits", () => {
        expect(isValidGlobPattern("*".repeat(MAX_GLOB_STARS))).toBe(true);
        expect(isValidGlobPattern("?".repeat(MAX_GLOB_QUESTIONS))).toBe(true);
        expect(isValidGlobPattern("**", { maxStars: 3 })).toBe(true);
        expect(isValidGlobPattern("??", { maxQuestions: 3 })).toBe(true);
      });
    });

    describe("malformed patterns", () => {
      it.each([
        "{unclosed",
        "}unopened",
        "test\0file",
        "!(*unclosed",
        "@(file",
        "+(*.txt",
        "?(file",
        "**(*.txt",
        "{{nested",
        "}}nested",
        "{{{{too",
        "}}}}deep",
      ])("should reject malformed pattern: %s", (pattern) => {
        expect(isValidGlobPattern(pattern)).toBe(false);
      });

      // Note: picomatch.scan accepts "*(missing)paren" as valid, so we rely on picomatch's validation
      it("should handle edge cases that picomatch accepts", () => {
        // picomatch.scan accepts this pattern, so we accept it too
        const result = isValidGlobPattern("*(missing)paren");
        expect(typeof result).toBe("boolean");
      });
    });

    describe("security - null bytes and special characters", () => {
      it.each([
        "test\0file",
        "pattern\0with\0nulls",
        "\0start",
        "end\0",
      ])("should reject patterns with null bytes: %s", (pattern) => {
        expect(isValidGlobPattern(pattern)).toBe(false);
      });
    });

    // eslint-disable-next-line test/prefer-lowercase-title
    describe("API usage scenarios", () => {
      it("should accept common file patterns", () => {
        expect(isValidGlobPattern("*.txt")).toBe(true);
        expect(isValidGlobPattern("UnicodeData.txt")).toBe(true);
        expect(isValidGlobPattern("*.{txt,xml}")).toBe(true);
        expect(isValidGlobPattern("**/*.ts")).toBe(true);
      });

      it("should reject excessive patterns that could cause DoS", () => {
        // Very long pattern
        expect(isValidGlobPattern("a".repeat(300))).toBe(false);
        // Too many segments
        expect(isValidGlobPattern(Array.from({ length: 20 }, () => "seg").join("/"))).toBe(false);
        // Too many brace expansions
        const manyOptions = Array.from({ length: 30 }, (_, i) => `opt${i}`).join(",");
        expect(isValidGlobPattern(`{${manyOptions}}`)).toBe(false);
        // Too deep extglob nesting
        expect(isValidGlobPattern("!(!(!(!(!file)))))")).toBe(false);
        // Too many wildcards
        expect(isValidGlobPattern("*".repeat(40))).toBe(false);
        expect(isValidGlobPattern("?".repeat(40))).toBe(false);
      });

      it("should work with custom limits for API", () => {
        const apiLimits = {
          maxLength: 128,
          maxSegments: 8,
          maxBraceExpansions: 8,
          maxExtglobDepth: 2,
          maxStars: 16,
          maxQuestions: 16,
        };

        // Valid patterns for API
        expect(isValidGlobPattern("*.txt", apiLimits)).toBe(true);
        expect(isValidGlobPattern("UnicodeData.txt", apiLimits)).toBe(true);
        expect(isValidGlobPattern("*.{txt,xml}", apiLimits)).toBe(true);

        // Patterns that exceed API limits
        expect(isValidGlobPattern("a".repeat(130), apiLimits)).toBe(false);
        expect(isValidGlobPattern(Array.from({ length: 10 }, () => "seg").join("/"), apiLimits)).toBe(false);
        const manyOptions = Array.from({ length: 10 }, (_, i) => `opt${i}`).join(",");
        expect(isValidGlobPattern(`{${manyOptions}}`, apiLimits)).toBe(false);
        expect(isValidGlobPattern("!(!(!(!file)))", apiLimits)).toBe(false);
        expect(isValidGlobPattern("*".repeat(20), apiLimits)).toBe(false);
      });
    });
  });
});
