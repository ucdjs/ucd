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
});
