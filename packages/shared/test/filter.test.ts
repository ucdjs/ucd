import type { TreeEntry } from "../src/filter";
import { describe, expect, it } from "vitest";
import { createPathFilter, DEFAULT_EXCLUSIONS, filterTreeStructure } from "../src/filter";
import { flattenFilePaths } from "../src/flatten";

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
      // multiple include patterns
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
      const filter = createPathFilter([
        "**/*.{js,ts,jsx,tsx,vue,svelte}",
        "!**/node_modules/**",
        "!**/dist/**",
        "!**/build/**",
        "!**/*.test.*",
        "!**/*.spec.*",
      ]);

      expect(filter(path)).toBe(expected);
    });

    it.each([
      ["docs/guide.md", true, "includes docs markdown"],
      ["content/blog/post.mdx", true, "includes mdx files"],
      ["LICENSE.txt", true, "includes txt files"],
      ["README.md", false, "excludes README specifically"],
      ["docs/README.md", false, "excludes README in subdirs"],
      ["node_modules/package/README.md", false, "excludes node_modules"],
      ["src/component.js", false, "excludes non-doc files"],
    ])("documentation filter: path \"%s\" should return %s (%s)", (path, expected) => {
      const filter = createPathFilter([
        "**/*.{md,mdx,txt}",
        "!**/node_modules/**",
        "!**/README.md",
      ]);

      expect(filter(path)).toBe(expected);
    });
  });

  describe("edge cases and special patterns", () => {
    it.each([
      // case insensitive matching (nocase: true option)
      [["*.TXT"], "file.txt", true, "matches different case"],
      [["*.txt"], "FILE.TXT", true, "matches different case reverse"],
      [["SRC/**"], "src/file.js", true, "matches directory different case"],

      // dot files (dot: true option)
      [[".*"], ".gitignore", true, "matches dot files"],
      [[".*"], ".env", true, "matches env file"],
      [[".*"], "file.txt", false, "does not match regular files with dot pattern"],
      [["**/.git/**"], ".git/config", true, "matches hidden directories"],
    ])("with filters %j, path \"%s\" should return %s (%s)", (filters, path, expected) => {
      const filter = createPathFilter(filters);
      expect(filter(path)).toBe(expected);
    });

    it.each([
      // paths with special characters
      [["**/file with spaces.txt"], "dir/file with spaces.txt", true, "matches paths with spaces"],
      [["**/*-file.js"], "src/my-file.js", true, "matches paths with hyphens"],
      [["**/*.file"], "test.file", true, "matches extension-like endings"],

      // multiple slashes and path normalization
      [["src/**"], "src//file.js", true, "handles double slashes"],
      [["**/dir/**"], "path/dir/file.js", true, "matches nested directories"],
    ])("edge case: filters %j, path \"%s\" should return %s (%s)", (filters, path, expected) => {
      const filter = createPathFilter(filters);
      expect(filter(path)).toBe(expected);
    });
  });

  describe("pattern precedence", () => {
    it("should handle order of include and exclude patterns correctly", () => {
      // exclude patterns should override include patterns
      const filter1 = createPathFilter(["*.js", "!test.js"]);
      expect(filter1("index.js")).toBe(true);
      expect(filter1("test.js")).toBe(false);

      // same patterns in different order should work the same
      const filter2 = createPathFilter(["!test.js", "*.js"]);
      expect(filter2("index.js")).toBe(true);
      expect(filter2("test.js")).toBe(true);
    });

    it.each([
      // more specific excludes should work with broader includes
      [["**/*.js", "!**/test/**/*.js"], "src/index.js", true],
      [["**/*.js", "!**/test/**/*.js"], "test/unit/spec.js", false],
      [["**/*.js", "!**/test/**/*.js"], "src/test.js", true], // test.js not in test/ dir

      // multiple overlapping excludes
      [["src/**", "!src/temp/**", "!src/**/*.log"], "src/file.js", true],
      [["src/**", "!src/temp/**", "!src/**/*.log"], "src/temp/file.js", false],
      [["src/**", "!src/temp/**", "!src/**/*.log"], "src/debug.log", false],
      [["src/**", "!src/temp/**", "!src/**/*.log"], "src/temp/debug.log", false],
    ])("pattern precedence: filters %j, path \"%s\" should return %s", (filters, path, expected) => {
      const filter = createPathFilter(filters);

      expect(filter(path)).toBe(expected);
    });

    it("should handle exclude-first mixed patterns", () => {
      const filter = createPathFilter([
        "!**/extracted/**",
        "**/*.txt",
      ]);

      expect(filter("file.txt")).toBe(true);
      expect(filter("extracted/file.txt")).toBe(true);
      expect(filter("extracted/nested/file.txt")).toBe(true);
      expect(filter("other/file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);
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

      // initial behavior
      expect(filter("Data.txt")).toBe(true);
      expect(filter("DataTest.txt")).toBe(false);
      expect(filter("file.js")).toBe(false);

      // extend with additional filters
      filter.extend(["!*.txt"]);

      // new behavior after extension
      expect(filter("Data.txt")).toBe(false); // now excluded
      expect(filter("DataTest.txt")).toBe(false); // still excluded
      expect(filter("file.js")).toBe(false); // still excluded
    });

    it("should extend with include patterns", () => {
      const filter = createPathFilter(["*.txt"]);

      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);
      expect(filter("file.md")).toBe(false);

      filter.extend(["*.js", "*.md"]);

      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(true); // now included
      expect(filter("file.md")).toBe(true); // now included
      expect(filter("file.css")).toBe(false); // still excluded
    });

    it("should extend with mixed include and exclude patterns", () => {
      const filter = createPathFilter(["src/**"]);

      expect(filter("src/file.js")).toBe(true);
      expect(filter("src/test.js")).toBe(true);
      expect(filter("lib/file.js")).toBe(false);

      filter.extend(["lib/**", "!**/test.*"]);

      expect(filter("src/file.js")).toBe(true);
      expect(filter("src/test.js")).toBe(false); // now excluded by new pattern
      expect(filter("lib/file.js")).toBe(true); // now included
      expect(filter("lib/test.js")).toBe(false); // excluded by new pattern
    });

    it("should handle multiple extensions", () => {
      const filter = createPathFilter(["*.txt"]);

      filter.extend(["*.js"]);
      filter.extend(["!*test*"]);
      filter.extend(["*.md"]);

      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(true);
      expect(filter("file.md")).toBe(true);
      expect(filter("test.txt")).toBe(false); // excluded by third extension
      expect(filter("test.js")).toBe(false); // excluded by third extension
      expect(filter("file.css")).toBe(false); // never included
    });

    it("should extend empty filter", () => {
      const filter = createPathFilter([]);

      // initially allows everything
      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(true);

      filter.extend(["*.txt"]);

      // now only allows txt files
      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);
    });

    it("should extend with empty array (no-op)", () => {
      const filter = createPathFilter(["*.txt"]);

      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);

      filter.extend([]);

      // behavior should remain the same
      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);
    });

    it("should work with more complex structure", () => {
      // start with basic source files
      const filter = createPathFilter(["src/**/*.{js,ts}"]);

      expect(filter("src/index.js")).toBe(true);
      expect(filter("src/utils.ts")).toBe(true);
      expect(filter("src/style.css")).toBe(false);
      expect(filter("test/spec.js")).toBe(false);

      // add test files
      filter.extend(["test/**/*.{js,ts}"]);

      expect(filter("src/index.js")).toBe(true);
      expect(filter("test/spec.js")).toBe(true); // now included
      expect(filter("test/style.css")).toBe(false); // still excluded

      // exclude node_modules and dist
      filter.extend(["!**/node_modules/**", "!**/dist/**"]);

      expect(filter("src/index.js")).toBe(true);
      expect(filter("test/spec.js")).toBe(true);
      expect(filter("node_modules/lib/index.js")).toBe(false); // now excluded
      expect(filter("dist/bundle.js")).toBe(false); // now excluded
    });

    it("should handle extending with duplicate patterns", () => {
      const filter = createPathFilter(["*.txt"]);

      filter.extend(["*.txt", "*.js"]); // duplicate *.txt
      filter.extend(["*.js"]); // duplicate *.js

      expect(filter.patterns()).toEqual(expect.arrayContaining([
        "*.txt",
        "*.txt",
        "*.js",
        "*.js",
      ]));
      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(true);
    });

    it("should handle extending with conflicting patterns", () => {
      const filter = createPathFilter(["*.txt"]);

      // add conflicting pattern
      filter.extend(["!*.txt"]);

      // exclusion should take precedence
      expect(filter("file.txt")).toBe(false);
    });
  });

  describe("patterns functionality", () => {
    it("should return initial filters", () => {
      const initialFilters = ["*.txt", "!*Test*"];
      const filter = createPathFilter(initialFilters);

      expect(filter.patterns()).toEqual(expect.arrayContaining([
        "*.txt",
        "!*Test*",
      ]));
    });

    it("should return updated filters after extension", () => {
      const filter = createPathFilter(["*.txt"]);

      expect(filter.patterns()).toEqual(expect.arrayContaining([
        "*.txt",
      ]));

      filter.extend(["*.js", "!*test*"]);

      expect(filter.patterns()).toEqual(expect.arrayContaining([
        "*.txt",
        "*.js",
        "!*test*",
      ]));
    });

    it("prevent mutating filters using patterns", () => {
      const filter = createPathFilter(["*.txt"]);

      const patterns = filter.patterns();

      expect(() => {
        // @ts-expect-error typescript gives type-errors since we are using readonly.
        patterns.push("*.js"); // try to mutate the returned array
      }).toThrow("Cannot add property 4, object is not extensible");

      expect(filter.patterns()).toEqual(expect.arrayContaining([
        "*.txt",
      ])); // should not be affected
      expect(filter("file.js")).toBe(false); // filter behavior should not change
    });

    it("should track multiple extensions correctly", () => {
      const filter = createPathFilter(["*.txt"]);

      filter.extend(["*.js"]);
      expect(filter.patterns()).toEqual(expect.arrayContaining([
        "*.txt",
        "*.js",
      ]));

      filter.extend(["!*test*"]);
      expect(filter.patterns()).toEqual(expect.arrayContaining([
        ...DEFAULT_EXCLUSIONS.map((pattern) => `!${pattern}`),
        "*.txt",
        "*.js",
        "!*test*",
      ]));

      filter.extend(["*.md", "*.css"]);
      expect(filter.patterns()).toEqual(expect.arrayContaining([
        ...DEFAULT_EXCLUSIONS.map((pattern) => `!${pattern}`),
        "*.txt",
        "*.js",
        "!*test*",
        "*.md",
        "*.css",
      ]));
    });

    it("should handle empty initial filters", () => {
      const filter = createPathFilter([]);

      expect(filter.patterns()).toEqual(DEFAULT_EXCLUSIONS.map((pattern) => `!${pattern}`));

      filter.extend(["*.txt"]);
      expect(filter.patterns()).toEqual([
        ...DEFAULT_EXCLUSIONS.map((pattern) => `!${pattern}`),
        "*.txt",
      ]);
    });
  });

  describe("extraFilters parameter", () => {
    it.each([
      // basic extra include filters
      [["*.txt"], "file.txt", ["*.js"], true, "base filter still matches"],
      [["*.txt"], "file.js", ["*.js"], true, "extra include filter works"],
      [["*.txt"], "file.css", ["*.js"], false, "matches neither base nor extra"],

      // extra exclude filters
      [["**/*.txt"], "file.txt", ["!*test*"], true, "not matching extra exclude"],
      [["**/*.txt"], "test.txt", ["!*test*"], false, "matching extra exclude"],
      [["**/*.txt"], "file.js", ["!*test*"], false, "doesn't match base, extra irrelevant"],

      // multiple extra filters
      [["*.txt"], "file.txt", ["*.js", "*.md"], true, "matches base with multiple extras"],
      [["*.txt"], "file.js", ["*.js", "*.md"], true, "matches first extra"],
      [["*.txt"], "file.md", ["*.js", "*.md"], true, "matches second extra"],
      [["*.txt"], "file.css", ["*.js", "*.md"], false, "matches none"],

      // complex base with extra filters
      [["src/**/*.js"], "src/index.js", ["lib/**/*.js"], true, "base still works with extra"],
      [["src/**/*.js"], "lib/index.js", ["lib/**/*.js"], true, "extra expands base"],
      [["src/**/*.js"], "src/style.css", ["lib/**/*.js"], false, "wrong extension"],
      [["src/**/*.js"], "lib/style.css", ["lib/**/*.js"], false, "wrong extension in extra"],

      // mixed include/exclude in extras
      [["src/**"], "src/index.js", ["lib/**", "!**/test.*"], true, "base + extra, not test"],
      [["src/**"], "src/test.js", ["lib/**", "!**/test.*"], false, "base but matches exclude"],
      [["src/**"], "lib/index.js", ["lib/**", "!**/test.*"], true, "extra, not test"],
      [["src/**"], "lib/test.js", ["lib/**", "!**/test.*"], false, "extra but matches exclude"],

      // empty extra filters (should behave like base only)
      [["*.txt"], "file.txt", [], true, "empty extra filters, matches base"],
      [["*.txt"], "file.js", [], false, "empty extra filters, doesn't match base"],

      // default exclusions with extra filters
      [["**/*"], "file.txt", ["!*.txt"], false, "extra exclusion overrides base"],
      [["**/*"], "file.zip", ["!*.txt"], false, "default exclusion still applies"],
      [["**/*"], "file.js", ["!*.txt"], true, "not excluded by either"],
    ])("with base %j, path '%s', extra %j should return %s (%s)", (baseFilters, path, extraFilters, expected) => {
      const filter = createPathFilter(baseFilters);
      expect(filter(path, extraFilters)).toBe(expected);
    });

    it("should handle complex real-world scenario with extra filters", () => {
      const filter = createPathFilter(["src/**/*.{js,ts,tsx}"]);

      // Scenario 1: Add test files temporarily
      const withTests = ["test/**/*.{js,ts}"];
      expect(filter("src/index.ts", withTests)).toBe(true);
      expect(filter("test/spec.ts", withTests)).toBe(true);
      expect(filter("test/style.css", withTests)).toBe(false);

      // Scenario 2: Exclude generated files
      const excludeGenerated = ["!**/*.generated.*"];
      expect(filter("src/index.ts", excludeGenerated)).toBe(true);
      expect(filter("src/api.generated.ts", excludeGenerated)).toBe(false);

      // Scenario 3: Complex combination
      const complexExtra = ["test/**/*.ts", "!**/*.generated.*", "!**/*.spec.*"];
      expect(filter("src/index.ts", complexExtra)).toBe(true);
      expect(filter("test/utils.ts", complexExtra)).toBe(true);
      expect(filter("test/component.spec.ts", complexExtra)).toBe(false);
      expect(filter("src/api.generated.ts", complexExtra)).toBe(false);
    });

    it("should handle extra filters with disableDefaultExclusions option", () => {
      const filter = createPathFilter(["**/*"], { disableDefaultExclusions: true });

      expect(filter("file.zip")).toBe(true);
      expect(filter("file.pdf")).toBe(true);
      expect(filter("file.zip", ["!*.zip"])).toBe(false);
      expect(filter("file.pdf", ["!*.zip"])).toBe(true);
    });
  });

  describe("implementation details", () => {
    it("should have extend method", () => {
      const filter = createPathFilter(["*.txt"]);
      expect(typeof filter.extend).toBe("function");
    });

    it("should have patterns method", () => {
      const filter = createPathFilter(["*.txt"]);
      expect(typeof filter.patterns).toBe("function");
    });
  });
});

describe.todo("filter tree structure", () => {
  describe("basic filtering", () => {
    const tree: TreeEntry[] = [
      {
        type: "file",
        name: "root-file.txt",
        path: "root-file.txt",
      },
      {
        type: "file",
        name: "root-config.json",
        path: "root-config.json",
      },
      {
        type: "directory",
        name: "extracted",
        path: "extracted",
        children: [
          {
            type: "file",
            name: "DerivedBidiClass.txt",
            path: "DerivedBidiClass.txt",
          },
          {
            type: "file",
            name: "config.json",
            path: "config.json",
          },
          {
            type: "directory",
            name: "nested",
            path: "nested",
            children: [
              {
                type: "file",
                name: "DeepFile.txt",
                path: "DeepFile.txt",
              },
              {
                type: "file",
                name: "debug.log",
                path: "debug.log",
              },
            ],
          },
        ],
      },
    ];

    it("should include all items when no filters are applied", () => {
      const filter = createPathFilter([]);
      const result = filterTreeStructure(filter, tree);

      expect(result).toEqual(tree);
    });

    it("should filter out files that don't match include pattern", () => {
      const filter = createPathFilter(["**/*.txt"]);
      const result = filterTreeStructure(filter, tree);

      expect(result).toEqual([
        {
          type: "file",
          name: "root-file.txt",
          path: "root-file.txt",
        },
        {
          type: "directory",
          name: "extracted",
          path: "extracted",
          children: [
            {
              type: "file",
              name: "DerivedBidiClass.txt",
              path: "DerivedBidiClass.txt",
            },
            {
              type: "directory",
              name: "nested",
              path: "nested",
              children: [
                {
                  type: "file",
                  name: "DeepFile.txt",
                  path: "DeepFile.txt",
                },
              ],
            },
          ],
        },
      ]);
    });

    it("should exclude specific files", () => {
      const filter = createPathFilter(["!**/config.json"]);
      const result = filterTreeStructure(filter, tree);

      const flattened = flattenFilePaths(result);

      expect(flattened).toEqual([
        "root-file.txt",
        "root-config.json",
        "extracted/DerivedBidiClass.txt",
        "extracted/nested/DeepFile.txt",
        "extracted/nested/debug.log",
      ]);
    });

    it("should handle directory ignore pattern", () => {
      const filter = createPathFilter([
        "!**/extracted",
      ]);
      const result = filterTreeStructure(filter, tree);

      const flattened = flattenFilePaths(result);

      expect(flattened).toEqual([
        "root-file.txt",
        "root-config.json",
      ]);
    });

    it("should handle directory contents ignore pattern", () => {
      const filter = createPathFilter([
        "!**/extracted/**",
      ]);
      const result = filterTreeStructure(filter, tree);

      const flattened = flattenFilePaths(result);

      expect(flattened).toEqual([
        "root-file.txt",
        "root-config.json",
        "extracted",
      ]);
    });

    it("should handle exclude patterns with include patterns", () => {
      const filter = createPathFilter([
        "!**/extracted/**",
        "**/*.txt",
      ]);
      const result = filterTreeStructure(filter, tree);

      const flattened = flattenFilePaths(result);

      expect(flattened).toEqual([
        "root-file.txt",
        "extracted/DerivedBidiClass.txt",
        "extracted/nested/DeepFile.txt",
      ]);
    });
  });
});
