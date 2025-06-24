import { describe, expect, it } from "vitest";
import { createPathFilter } from "../src/filter";

describe("createPathFilter", () => {
  describe("empty filters", () => {
    it("should return a function that always returns true when no filters provided", () => {
      const filter = createPathFilter([]);
      expect(filter("any/path.txt")).toBe(true);
      expect(filter("another/file.js")).toBe(true);
      expect(filter(".hidden")).toBe(true);
    });
  });

  describe("include patterns only", () => {
    it.each([
      // [filters, path, expected, description]
      [["*.txt"], "file.txt", true, "matches txt extension in current directory"],
      [["*.txt"], "file.js", false, "does not match txt extension"],
      [["*.txt"], "dir/file.txt", false, "does not match txt in subdirectory"],
      [["**/*.txt"], "dir/file.txt", true, "matches txt in subdirectory with glob pattern"],
      [["**/*.js"], "src/index.js", true, "matches js with glob pattern"],
      [["**/*.js"], "src/styles.css", false, "does not match js with glob pattern"],
      [["src/**"], "src/file.txt", true, "matches directory pattern"],
      [["src/**"], "lib/file.txt", false, "does not match directory pattern"],
    ])("with filters %j, path \"%s\" should return %s (%s)", (filters, path, expected) => {
      const filter = createPathFilter(filters);
      expect(filter(path)).toBe(expected);
    });

    it.each([
      // Multiple include patterns
      [["*.txt", "*.js"], "file.txt", true],
      [["*.txt", "*.js"], "file.js", true],
      [["*.txt", "*.js"], "file.css", false],
      [["src/**", "lib/**"], "src/file.txt", true],
      [["src/**", "lib/**"], "lib/file.txt", true],
      [["src/**", "lib/**"], "test/file.txt", false],
    ])("with multiple include patterns %j, path \"%s\" should return %s", (filters, path, expected) => {
      const filter = createPathFilter(filters);
      expect(filter(path)).toBe(expected);
    });
  });

  describe("exclude patterns only", () => {
    it.each([
      [["!*.log"], "file.log", false, "excludes log files"],
      [["!*.log"], "file.txt", true, "includes non-log files"],
      [["!**/test/**"], "src/test/file.js", false, "excludes test directories"],
      [["!**/test/**"], "src/main/file.js", true, "includes non-test directories"],
      [["!node_modules/**"], "node_modules/lib/file.js", false, "excludes node_modules"],
      [["!node_modules/**"], "src/file.js", true, "includes non-node_modules"],
    ])("with filters %j, path \"%s\" should return %s (%s)", (filters, path, expected) => {
      const filter = createPathFilter(filters);
      expect(filter(path)).toBe(expected);
    });
  });

  describe("mixed include and exclude patterns", () => {
    it.each([
      // Include all JS files but exclude test files
      [["*.js", "!**/test/**"], "index.js", true, "includes js file not in test"],
      [["*.js", "!**/test/**"], "test/index.js", false, "excludes js file in test"],
      [["*.js", "!**/test/**"], "styles.css", false, "excludes non-js file"],

      // Include src directory but exclude specific files
      [["src/**", "!**/*.log"], "src/file.js", true, "includes src file"],
      [["src/**", "!**/*.log"], "src/debug.log", false, "excludes log file in src"],
      [["src/**", "!**/*.log"], "lib/file.js", false, "excludes file outside src"],

      // Multiple includes and excludes
      [["*.js", "*.ts", "!**/*.test.*", "!**/dist/**"], "index.js", true, "includes js file"],
      [["*.js", "*.ts", "!**/*.test.*", "!**/dist/**"], "index.ts", true, "includes ts file"],
      [["*.js", "*.ts", "!**/*.test.*", "!**/dist/**"], "index.test.js", false, "excludes test file"],
      [["*.js", "*.ts", "!**/*.test.*", "!**/dist/**"], "dist/index.js", false, "excludes dist file"],
      [["*.js", "*.ts", "!**/*.test.*", "!**/dist/**"], "styles.css", false, "excludes css file"],
    ])("with filters %j, path \"%s\" should return %s (%s)", (filters, path, expected) => {
      const filter = createPathFilter(filters);
      expect(filter(path)).toBe(expected);
    });
  });

  describe("case sensitivity and dot files", () => {
    it.each([
      // Case insensitive matching (nocase: true option)
      [["*.TXT"], "file.txt", true, "matches different case"],
      [["*.txt"], "FILE.TXT", true, "matches different case reverse"],
      [["SRC/**"], "src/file.js", true, "matches directory different case"],

      // Dot files (dot: true option)
      [[".*"], ".gitignore", true, "matches dot files"],
      [[".*"], ".env", true, "matches env file"],
      [[".*"], "file.txt", false, "does not match regular files with dot pattern"],
      [["**/.git/**"], ".git/config", true, "matches hidden directories"],
    ])("with filters %j, path \"%s\" should return %s (%s)", (filters, path, expected) => {
      const filter = createPathFilter(filters);
      expect(filter(path)).toBe(expected);
    });
  });

  describe("complex real-world scenarios", () => {
    const typicalProjectFilter = [
      "**/*.{js,ts,jsx,tsx,vue,svelte}",
      "!**/node_modules/**",
      "!**/dist/**",
      "!**/build/**",
      "!**/*.test.*",
      "!**/*.spec.*",
    ];

    it.each([
      ["src/components/Button.tsx", true, "includes source tsx file"],
      ["src/utils/helper.js", true, "includes source js file"],
      ["src/components/Button.vue", true, "includes vue file"],
      ["node_modules/react/index.js", false, "excludes node_modules"],
      ["dist/bundle.js", false, "excludes dist files"],
      ["build/main.js", false, "excludes build files"],
      ["src/components/Button.test.tsx", false, "excludes test files"],
      ["src/utils/helper.spec.js", false, "excludes spec files"],
      ["README.md", false, "excludes non-matching extensions"],
      ["package.json", false, "excludes json files"],
    ])("typical project filter: path \"%s\" should return %s (%s)", (path, expected) => {
      const filter = createPathFilter(typicalProjectFilter);
      expect(filter(path)).toBe(expected);
    });

    const documentationFilter = [
      "**/*.{md,mdx,txt}",
      "!**/node_modules/**",
      "!**/README.md",
    ];

    it.each([
      ["docs/guide.md", true, "includes docs markdown"],
      ["content/blog/post.mdx", true, "includes mdx files"],
      ["LICENSE.txt", true, "includes txt files"],
      ["README.md", false, "excludes README specifically"],
      ["docs/README.md", false, "excludes README in subdirs"],
      ["node_modules/package/README.md", false, "excludes node_modules"],
      ["src/component.js", false, "excludes non-doc files"],
    ])("documentation filter: path \"%s\" should return %s (%s)", (path, expected) => {
      const filter = createPathFilter(documentationFilter);
      expect(filter(path)).toBe(expected);
    });
  });

  describe("edge cases", () => {
    it.each([
      // Paths with special characters
      [["**/file with spaces.txt"], "dir/file with spaces.txt", true, "matches paths with spaces"],
      [["**/*-file.js"], "src/my-file.js", true, "matches paths with hyphens"],
      [["**/*.file"], "test.file", true, "matches extension-like endings"],

      // Multiple slashes and path normalization
      [["src/**"], "src//file.js", true, "handles double slashes"],
      [["**/dir/**"], "path/dir/file.js", true, "matches nested directories"],
    ])("edge case: filters %j, path \"%s\" should return %s (%s)", (filters, path, expected) => {
      const filter = createPathFilter(filters);
      expect(filter(path)).toBe(expected);
    });
  });

  describe("pattern precedence", () => {
    it("should handle order of include and exclude patterns correctly", () => {
      // Exclude patterns should override include patterns
      const filter1 = createPathFilter(["*.js", "!test.js"]);
      expect(filter1("index.js")).toBe(true);
      expect(filter1("test.js")).toBe(false);

      // Same patterns in different order should work the same
      const filter2 = createPathFilter(["!test.js", "*.js"]);
      expect(filter2("index.js")).toBe(true);
      expect(filter2("test.js")).toBe(false);
    });

    it.each([
      // More specific excludes should work with broader includes
      [["**/*.js", "!**/test/**/*.js"], "src/index.js", true],
      [["**/*.js", "!**/test/**/*.js"], "test/unit/spec.js", false],
      [["**/*.js", "!**/test/**/*.js"], "src/test.js", true], // test.js not in test/ dir

      // Multiple overlapping excludes
      [["src/**", "!src/temp/**", "!src/**/*.log"], "src/file.js", true],
      [["src/**", "!src/temp/**", "!src/**/*.log"], "src/temp/file.js", false],
      [["src/**", "!src/temp/**", "!src/**/*.log"], "src/debug.log", false],
      [["src/**", "!src/temp/**", "!src/**/*.log"], "src/temp/debug.log", false],
    ])("pattern precedence: filters %j, path \"%s\" should return %s", (filters, path, expected) => {
      const filter = createPathFilter(filters);
      expect(filter(path)).toBe(expected);
    });
  });

  describe("return value type", () => {
    it("should return a function with correct type signature", () => {
      const filter = createPathFilter(["*.txt"]);
      expect(typeof filter).toBe("function");
      expect(filter).toHaveLength(1); // function should accept 1 parameter

      const result = filter("test.txt");
      expect(typeof result).toBe("boolean");
    });

    it("should be reusable", () => {
      const filter = createPathFilter(["*.js"]);

      // Same filter function should work multiple times
      expect(filter("file1.js")).toBe(true);
      expect(filter("file2.js")).toBe(true);
      expect(filter("file.txt")).toBe(false);
      expect(filter("file1.js")).toBe(true); // Should still work
    });
  });

  describe("disableDefaultExclusions option", () => {
    it("should not exclude default patterns when disableDefaultExclusions is true", () => {
      const filter = createPathFilter([], { disableDefaultExclusions: true });
      expect(filter("file.zip")).toBe(true);
      expect(filter("file.pdf")).toBe(true);
      expect(filter("file.txt")).toBe(true);
    });

    it("should still apply custom filters when disableDefaultExclusions is true", () => {
      const filter = createPathFilter(["!*.txt"], { disableDefaultExclusions: true });
      expect(filter("file.txt")).toBe(false);
      expect(filter("file.zip")).toBe(true);
      expect(filter("file.pdf")).toBe(true);
    });
  });

  describe("extend functionality", () => {
    it("should extend filters with additional patterns", () => {
      const filter = createPathFilter(["*.txt", "!*Test*"]);

      // Initial behavior
      expect(filter("Data.txt")).toBe(true);
      expect(filter("DataTest.txt")).toBe(false);
      expect(filter("file.js")).toBe(false);

      // Extend with additional filters
      filter.extend(["!*.txt"]);

      // New behavior after extension
      expect(filter("Data.txt")).toBe(false); // Now excluded
      expect(filter("DataTest.txt")).toBe(false); // Still excluded
      expect(filter("file.js")).toBe(false); // Still excluded
    });

    it("should extend with include patterns", () => {
      const filter = createPathFilter(["*.txt"]);

      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);
      expect(filter("file.md")).toBe(false);

      filter.extend(["*.js", "*.md"]);

      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(true); // Now included
      expect(filter("file.md")).toBe(true); // Now included
      expect(filter("file.css")).toBe(false); // Still excluded
    });

    it("should extend with mixed include and exclude patterns", () => {
      const filter = createPathFilter(["src/**"]);

      expect(filter("src/file.js")).toBe(true);
      expect(filter("src/test.js")).toBe(true);
      expect(filter("lib/file.js")).toBe(false);

      filter.extend(["lib/**", "!**/test.*"]);

      expect(filter("src/file.js")).toBe(true);
      expect(filter("src/test.js")).toBe(false); // Now excluded by new pattern
      expect(filter("lib/file.js")).toBe(true); // Now included
      expect(filter("lib/test.js")).toBe(false); // Excluded by new pattern
    });

    it("should handle multiple extensions", () => {
      const filter = createPathFilter(["*.txt"]);

      filter.extend(["*.js"]);
      filter.extend(["!*test*"]);
      filter.extend(["*.md"]);

      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(true);
      expect(filter("file.md")).toBe(true);
      expect(filter("test.txt")).toBe(false); // Excluded by third extension
      expect(filter("test.js")).toBe(false); // Excluded by third extension
      expect(filter("file.css")).toBe(false); // Never included
    });

    it("should extend empty filter", () => {
      const filter = createPathFilter([]);

      // Initially allows everything
      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(true);

      filter.extend(["*.txt"]);

      // Now only allows txt files
      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);
    });

    it("should extend with empty array (no-op)", () => {
      const filter = createPathFilter(["*.txt"]);

      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);

      filter.extend([]);

      // Behavior should remain the same
      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);
    });

    it("should work with complex real-world extension scenario", () => {
      // Start with basic source files
      const filter = createPathFilter(["src/**/*.{js,ts}"]);

      expect(filter("src/index.js")).toBe(true);
      expect(filter("src/utils.ts")).toBe(true);
      expect(filter("src/style.css")).toBe(false);
      expect(filter("test/spec.js")).toBe(false);

      // Add test files
      filter.extend(["test/**/*.{js,ts}"]);

      expect(filter("src/index.js")).toBe(true);
      expect(filter("test/spec.js")).toBe(true); // Now included
      expect(filter("test/style.css")).toBe(false); // Still excluded

      // Exclude node_modules and dist
      filter.extend(["!**/node_modules/**", "!**/dist/**"]);

      expect(filter("src/index.js")).toBe(true);
      expect(filter("test/spec.js")).toBe(true);
      expect(filter("node_modules/lib/index.js")).toBe(false); // Now excluded
      expect(filter("dist/bundle.js")).toBe(false); // Now excluded
    });
  });

  describe("patterns functionality", () => {
    it("should return initial filters", () => {
      const initialFilters = ["*.txt", "!*Test*"];
      const filter = createPathFilter(initialFilters);

      expect(filter.patterns()).toEqual(initialFilters);
    });

    it("should return updated filters after extension", () => {
      const filter = createPathFilter(["*.txt"]);

      expect(filter.patterns()).toEqual(["*.txt"]);

      filter.extend(["*.js", "!*test*"]);

      expect(filter.patterns()).toEqual(["*.txt", "*.js", "!*test*"]);
    });

    it("should return a copy of filters (immutable)", () => {
      const filter = createPathFilter(["*.txt"]);

      const filters1 = filter.patterns();
      filters1.push("*.js"); // Mutate the returned array

      const filters2 = filter.patterns();
      expect(filters2).toEqual(["*.txt"]); // Should not be affected
      expect(filter("file.js")).toBe(false); // Filter behavior should not change
    });

    it("should track multiple extensions correctly", () => {
      const filter = createPathFilter(["*.txt"]);

      filter.extend(["*.js"]);
      expect(filter.patterns()).toEqual(["*.txt", "*.js"]);

      filter.extend(["!*test*"]);
      expect(filter.patterns()).toEqual(["*.txt", "*.js", "!*test*"]);

      filter.extend(["*.md", "*.css"]);
      expect(filter.patterns()).toEqual(["*.txt", "*.js", "!*test*", "*.md", "*.css"]);
    });

    it("should handle empty initial filters", () => {
      const filter = createPathFilter([]);

      expect(filter.patterns()).toEqual([]);

      filter.extend(["*.txt"]);
      expect(filter.patterns()).toEqual(["*.txt"]);
    });
  });

  describe("filter methods type checking", () => {
    it("should have extend method", () => {
      const filter = createPathFilter(["*.txt"]);
      expect(typeof filter.extend).toBe("function");
    });

    it("should have patterns method", () => {
      const filter = createPathFilter(["*.txt"]);
      expect(typeof filter.patterns).toBe("function");
    });

    it("should maintain function signature after extension", () => {
      const filter = createPathFilter(["*.txt"]);
      filter.extend(["*.js"]);

      expect(typeof filter).toBe("function");
      expect(filter).toHaveLength(1);
      expect(typeof filter.extend).toBe("function");
      expect(typeof filter.patterns).toBe("function");
    });
  });

  describe("performance and edge cases with extension", () => {
    it("should handle many extensions efficiently", () => {
      const filter = createPathFilter(["*.txt"]);

      // Extend many times
      for (let i = 0; i < 100; i++) {
        filter.extend([`!*test${i}*`]);
      }

      expect(filter("file.txt")).toBe(true);
      expect(filter("test50.txt")).toBe(false);
      expect(filter.patterns()).toHaveLength(101); // 1 initial + 100 extensions
    });

    it("should handle extending with duplicate patterns", () => {
      const filter = createPathFilter(["*.txt"]);

      filter.extend(["*.txt", "*.js"]); // Duplicate *.txt
      filter.extend(["*.js"]); // Duplicate *.js

      expect(filter.patterns()).toEqual(["*.txt", "*.txt", "*.js", "*.js"]);
      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(true);
    });

    it("should handle extending with conflicting patterns", () => {
      const filter = createPathFilter(["*.txt"]);

      // add conflicting pattern
      filter.extend(["!*.txt"]);

      // Exclusion should take precedence
      expect(filter("file.txt")).toBe(false);
    });
  });

  describe("extraFilters parameter", () => {
    it("should work without extraFilters parameter (default empty array)", () => {
      const filter = createPathFilter(["*.txt"]);

      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);
    });

    it("should apply extra filters on top of base filters", () => {
      const filter = createPathFilter(["*.txt"]);

      // Base behavior
      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);

      // With extra include filters
      expect(filter("file.txt", ["*.js"])).toBe(true); // Still matches base
      expect(filter("file.js", ["*.js"])).toBe(true); // Now matches extra
      expect(filter("file.css", ["*.js"])).toBe(false); // Matches neither
    });

    it("should apply extra exclude filters", () => {
      const filter = createPathFilter(["**/*.txt"]);

      // Base behavior - includes all txt files
      expect(filter("file.txt")).toBe(true);
      expect(filter("test.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);

      // With extra exclude filters
      expect(filter("file.txt", ["!*test*"])).toBe(true); // Not matching exclude
      expect(filter("test.txt", ["!*test*"])).toBe(false); // Matching exclude
      expect(filter("file.js", ["!*test*"])).toBe(false); // Still doesn't match base
    });

    it("should combine base and extra filters properly", () => {
      const filter = createPathFilter(["src/**/*.js"]);

      // Base: only js files in src
      expect(filter("src/index.js")).toBe(true);
      expect(filter("src/style.css")).toBe(false);
      expect(filter("lib/index.js")).toBe(false);

      // Extra: add lib directory
      expect(filter("src/index.js", ["lib/**/*.js"])).toBe(true); // Base still works
      expect(filter("lib/index.js", ["lib/**/*.js"])).toBe(true); // Extra works
      expect(filter("src/style.css", ["lib/**/*.js"])).toBe(false); // Still excluded
      expect(filter("lib/style.css", ["lib/**/*.js"])).toBe(false); // Still excluded
    });

    it("should handle multiple extra filters", () => {
      const filter = createPathFilter(["*.txt"]);

      expect(filter("file.txt", ["*.js", "*.md"])).toBe(true); // Matches base
      expect(filter("file.js", ["*.js", "*.md"])).toBe(true); // Matches extra
      expect(filter("file.md", ["*.js", "*.md"])).toBe(true); // Matches extra
      expect(filter("file.css", ["*.js", "*.md"])).toBe(false); // Matches neither
    });

    it("should handle mixed include and exclude in extra filters", () => {
      const filter = createPathFilter(["src/**"]);

      // Base: includes all src files
      expect(filter("src/index.js")).toBe(true);
      expect(filter("src/test.js")).toBe(true);
      expect(filter("lib/index.js")).toBe(false);

      // Extra: add lib but exclude test files
      const extraFilters = ["lib/**", "!**/test.*"];
      expect(filter("src/index.js", extraFilters)).toBe(true); // Base, not test
      expect(filter("src/test.js", extraFilters)).toBe(false); // Base but is test
      expect(filter("lib/index.js", extraFilters)).toBe(true); // Extra, not test
      expect(filter("lib/test.js", extraFilters)).toBe(false); // Extra but is test
    });

    it("should not modify the base filter when using extra filters", () => {
      const filter = createPathFilter(["*.txt"]);

      // Use extra filters
      expect(filter("file.js", ["*.js"])).toBe(true);

      // Base filter should remain unchanged
      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false); // Should still be false without extra filters
    });

    it("should work with empty extra filters array", () => {
      const filter = createPathFilter(["*.txt"]);

      expect(filter("file.txt", [])).toBe(true);
      expect(filter("file.js", [])).toBe(false);

      // Should behave same as without extra filters parameter
      expect(filter("file.txt", [])).toBe(filter("file.txt"));
      expect(filter("file.js", [])).toBe(filter("file.js"));
    });

    it("should handle complex real-world scenario with extra filters", () => {
      // Base: TypeScript/JavaScript source files
      const filter = createPathFilter(["src/**/*.{js,ts,tsx}"]);

      // Base behavior
      expect(filter("src/index.ts")).toBe(true);
      expect(filter("src/component.tsx")).toBe(true);
      expect(filter("src/style.css")).toBe(false);
      expect(filter("test/spec.ts")).toBe(false);

      // Scenario 1: Temporarily include test files
      const withTests = ["test/**/*.{js,ts}"];
      expect(filter("src/index.ts", withTests)).toBe(true); // Still included
      expect(filter("test/spec.ts", withTests)).toBe(true); // Now included
      expect(filter("test/style.css", withTests)).toBe(false); // Still excluded

      // Scenario 2: Exclude specific patterns temporarily
      const excludeGenerated = ["!**/*.generated.*"];
      expect(filter("src/index.ts", excludeGenerated)).toBe(true); // Not generated
      expect(filter("src/api.generated.ts", excludeGenerated)).toBe(false); // Is generated

      // Scenario 3: Complex combination
      const complexExtra = ["test/**/*.ts", "!**/*.generated.*", "!**/*.spec.*"];
      expect(filter("src/index.ts", complexExtra)).toBe(true); // Source file
      expect(filter("test/utils.ts", complexExtra)).toBe(true); // Test file (not spec)
      expect(filter("test/component.spec.ts", complexExtra)).toBe(false); // Test but spec
      expect(filter("src/api.generated.ts", complexExtra)).toBe(false); // Source but generated
    });

    it("should handle extra filters with default exclusions", () => {
      const filter = createPathFilter(["**/*"]); // Include everything

      // Default exclusions should apply (zip, pdf)
      expect(filter("file.txt")).toBe(true);
      expect(filter("file.zip")).toBe(false); // Default exclusion
      expect(filter("file.pdf")).toBe(false); // Default exclusion

      // Extra filters should work with default exclusions
      expect(filter("file.txt", ["!*.txt"])).toBe(false); // Extra exclusion
      expect(filter("file.zip", ["!*.txt"])).toBe(false); // Still excluded by default
      expect(filter("file.js", ["!*.txt"])).toBe(true); // Not excluded by either
    });

    it("should handle extra filters with disableDefaultExclusions option", () => {
      const filter = createPathFilter(["**/*"], { disableDefaultExclusions: true });

      // No default exclusions
      expect(filter("file.zip")).toBe(true);
      expect(filter("file.pdf")).toBe(true);

      // Extra filters should still work
      expect(filter("file.zip", ["!*.zip"])).toBe(false); // Extra exclusion
      expect(filter("file.pdf", ["!*.zip"])).toBe(true); // Not excluded by extra
    });

    it("should maintain performance with extra filters", () => {
      const filter = createPathFilter(["src/**/*.js"]);

      // Multiple calls with same extra filters should work efficiently
      const extraFilters = ["test/**/*.js", "!**/*.min.js"];

      for (let i = 0; i < 10; i++) {
        expect(filter("src/index.js", extraFilters)).toBe(true);
        expect(filter("test/spec.js", extraFilters)).toBe(true);
        expect(filter("src/bundle.min.js", extraFilters)).toBe(false);
      }
    });
  });
});
