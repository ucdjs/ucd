import { describe, expect, it } from "vitest";
import { createGlobMatcher, DEFAULT_PICOMATCH_OPTIONS, isValidGlobPattern, matchGlob, MAX_BRACE_ALTERNATIVES, MAX_NESTING_DEPTH, MAX_PATTERN_LENGTH } from "../src/glob";

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
    it("should return true for valid simple patterns", () => {
      expect(isValidGlobPattern("*.txt")).toBe(true);
      expect(isValidGlobPattern("file.txt")).toBe(true);
      expect(isValidGlobPattern("*")).toBe(true);
      expect(isValidGlobPattern("?")).toBe(true);
    });

    it("should return true for valid patterns with brackets", () => {
      expect(isValidGlobPattern("file[123].txt")).toBe(true);
      expect(isValidGlobPattern("[a-z]*.txt")).toBe(true);
      expect(isValidGlobPattern("file[!0-9].txt")).toBe(true);
    });

    it("should return true for valid patterns with braces", () => {
      expect(isValidGlobPattern("*.{txt,xml}")).toBe(true);
      expect(isValidGlobPattern("{foo,bar,baz}")).toBe(true);
      expect(isValidGlobPattern("file.{txt,md,json}")).toBe(true);
    });

    it("should return true for valid complex patterns", () => {
      expect(isValidGlobPattern("**/*.txt")).toBe(true);
      expect(isValidGlobPattern("src/**/*.{ts,tsx}")).toBe(true);
      expect(isValidGlobPattern("**/[A-Z]*.txt")).toBe(true);
    });

    it("should return false for empty patterns", () => {
      expect(isValidGlobPattern("")).toBe(false);
      expect(isValidGlobPattern("   ")).toBe(false);
    });

    it("should return true for patterns with special chars that are valid", () => {
      // These are actually valid glob patterns
      expect(isValidGlobPattern("Uni*")).toBe(true);
      expect(isValidGlobPattern("*Data*")).toBe(true);
      expect(isValidGlobPattern("*.{txt,xml,json}")).toBe(true);
    });

    describe("malicious pattern detection", () => {
      it("should reject patterns that are too long", () => {
        const longPattern = "a".repeat(MAX_PATTERN_LENGTH + 1);
        const okPattern = "a".repeat(MAX_PATTERN_LENGTH);

        expect.soft(isValidGlobPattern(longPattern)).toBe(false);
        expect.soft(isValidGlobPattern(okPattern)).toBe(true);
      });

      it("should reject patterns with excessive consecutive wildcards", () => {
        expect(isValidGlobPattern("****")).toBe(false);
        expect(isValidGlobPattern("*****")).toBe(false);
        expect(isValidGlobPattern("file****name")).toBe(false);

        // ** (globstar) and *** should be allowed
        expect(isValidGlobPattern("**")).toBe(true);
        expect(isValidGlobPattern("***")).toBe(true);
        expect(isValidGlobPattern("**/*.txt")).toBe(true);
      });

      it("should reject patterns with too many brace alternatives", () => {
        const manyAlternatives = `{${Array.from({ length: MAX_BRACE_ALTERNATIVES + 1 }, (_, i) => String.fromCharCode(97 + i)).join(",")}}`;
        const okAlternatives = `{${Array.from({ length: MAX_BRACE_ALTERNATIVES }, (_, i) => String.fromCharCode(97 + i)).join(",")}}`;

        expect.soft(isValidGlobPattern(manyAlternatives)).toBe(false);
        expect.soft(isValidGlobPattern(okAlternatives)).toBe(true);
      });

      it("should reject patterns with too deep nesting", () => {
        const deeplyNested = `${"{a,".repeat(MAX_NESTING_DEPTH + 1)}x${"}".repeat(MAX_NESTING_DEPTH + 1)}`;
        const okNesting = `${"{a,".repeat(MAX_NESTING_DEPTH)}x${"}".repeat(MAX_NESTING_DEPTH)}`;

        expect.soft(isValidGlobPattern(deeplyNested)).toBe(false);
        expect.soft(isValidGlobPattern(okNesting)).toBe(true);
      });

      it("should reject patterns with unclosed opening brackets", () => {
        // Unclosed opening brackets should be rejected
        expect(isValidGlobPattern("file[123.txt")).toBe(false);
        expect(isValidGlobPattern("file{a,b.txt")).toBe(false);
        expect(isValidGlobPattern("file(test.txt")).toBe(false);
      });

      it("should allow patterns with stray closing brackets (picomatch treats as literal)", () => {
        // Picomatch treats stray closing brackets as literals
        expect(isValidGlobPattern("file]123.txt")).toBe(true);
        expect(isValidGlobPattern("file}a,b.txt")).toBe(true);
        expect(isValidGlobPattern("file)test.txt")).toBe(true);
      });

      it("should allow escaped special characters", () => {
        expect(isValidGlobPattern("file\\[123\\].txt")).toBe(true);
        expect(isValidGlobPattern("file\\{a,b\\}.txt")).toBe(true);
      });

      it("should handle consecutive backslashes correctly", () => {
        // \\\\ is two escaped backslashes, so the { is NOT escaped
        // This pattern has 6 alternatives which exceeds MAX_BRACE_ALTERNATIVES (5)
        expect(isValidGlobPattern("\\\\{a,b,c,d,e,f}")).toBe(false);

        // Single backslash escapes the opening brace, so it's literal {
        // The } is then a stray closing brace (treated as literal by picomatch)
        // No brace expansion happens, so this is valid
        expect(isValidGlobPattern("\\{a,b,c,d,e,f}")).toBe(true);

        // \\\\ + \{ = escaped backslash + escaped brace (both braces escaped)
        expect(isValidGlobPattern("\\\\\\{a,b,c,d,e,f\\}")).toBe(true);
      });

      it("should count alternatives per brace level independently (nested braces)", () => {
        // Outer brace has 2 alternatives, inner has 5 alternatives - should be valid
        expect(isValidGlobPattern("{a{b,c,d,e,f},g}")).toBe(true);

        // Outer brace has 2 alternatives, inner has 6 alternatives - should be invalid
        expect(isValidGlobPattern("{a{b,c,d,e,f,g},h}")).toBe(false);

        // Both levels at max (5 alternatives each)
        expect(isValidGlobPattern("{a{1,2,3,4,5},b,c,d,e}")).toBe(true);
      });

      it("should count alternatives independently for sequential brace groups", () => {
        // Two sequential groups, each with 5 alternatives - should be valid
        expect(isValidGlobPattern("{a,b,c,d,e}{f,g,h,i,j}")).toBe(true);

        // First group valid, second exceeds limit - should be invalid
        expect(isValidGlobPattern("{a,b,c,d,e}{f,g,h,i,j,k}")).toBe(false);
      });

      it("should handle closing braces inside square brackets correctly", () => {
        // } inside square brackets should not close the outer brace group
        expect(isValidGlobPattern("{a,[}],b}")).toBe(true);
        expect(isValidGlobPattern("[}]")).toBe(true);
        expect(isValidGlobPattern("{a,b,[}]}")).toBe(true);
      });

      it("should handle closing braces inside parentheses correctly", () => {
        // } inside parentheses should not close the outer brace group
        expect(isValidGlobPattern("{a,(?:}),b}")).toBe(true);
        expect(isValidGlobPattern("(})")).toBe(true);
      });
    });
  });
});
