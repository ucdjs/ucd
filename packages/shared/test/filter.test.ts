import type { TreeEntry } from "../src/filter";
import { describe, expect, it } from "vitest";
import { createPathFilter, filterTreeStructure } from "../src/filter";

describe("createPathFilter", () => {
  it("should allow all paths when no patterns are provided", () => {
    const filter = createPathFilter({});

    expect(filter("any/path.txt")).toBe(true);
    expect(filter("another/file.js")).toBe(true);
    expect(filter(".hidden")).toBe(true);
    expect(filter("./hidden")).toBe(true);
    expect(filter("subdir/../../test.directory/file.js")).toBe(false);
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
    ])("with include %j, path \"%s\" should return %s (%s)", (include, path, expected) => {
      const filter = createPathFilter({ include });
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
    ])("with multiple include patterns %j, path \"%s\" should return %s", (include, path, expected) => {
      const filter = createPathFilter({ include });
      expect(filter(path)).toBe(expected);
    });
  });

  describe("exclude patterns only", () => {
    it.each([
      [["*.log"], "file.log", false, "excludes log files"],
      [["*.log"], "file.txt", true, "includes non-log files"],
      [["**/test/**"], "src/test/file.js", false, "excludes test directories"],
      [["**/test/**"], "src/main/file.js", true, "includes non-test directories"],
      [["node_modules/**"], "node_modules/lib/file.js", false, "excludes node_modules"],
      [["node_modules/**"], "src/file.js", true, "includes non-node_modules"],
    ])("with exclude %j, path \"%s\" should return %s (%s)", (exclude, path, expected) => {
      const filter = createPathFilter({ exclude });
      expect(filter(path)).toBe(expected);
    });
  });

  describe("mixed include and exclude patterns", () => {
    it.each([
      // Include all JS files but exclude test files
      [{ include: ["*.js"], exclude: ["**/test/**"] }, "index.js", true, "includes js file not in test"],
      [{ include: ["*.js"], exclude: ["**/test/**"] }, "test/index.js", false, "excludes js file in test"],
      [{ include: ["*.js"], exclude: ["**/test/**"] }, "styles.css", false, "excludes non-js file"],

      // Include src directory but exclude specific files
      [{ include: ["src/**"], exclude: ["**/*.log"] }, "src/file.js", true, "includes src file"],
      [{ include: ["src/**"], exclude: ["**/*.log"] }, "src/debug.log", false, "excludes log file in src"],
      [{ include: ["src/**"], exclude: ["**/*.log"] }, "lib/file.js", false, "excludes file outside src"],

      // Multiple includes and excludes
      [{ include: ["*.js", "*.ts"], exclude: ["**/*.test.*", "**/dist/**"] }, "index.js", true, "includes js file"],
      [{ include: ["*.js", "*.ts"], exclude: ["**/*.test.*", "**/dist/**"] }, "index.ts", true, "includes ts file"],
      [{ include: ["*.js", "*.ts"], exclude: ["**/*.test.*", "**/dist/**"] }, "index.test.js", false, "excludes test file"],
      [{ include: ["*.js", "*.ts"], exclude: ["**/*.test.*", "**/dist/**"] }, "dist/index.js", false, "excludes dist file"],
      [{ include: ["*.js", "*.ts"], exclude: ["**/*.test.*", "**/dist/**"] }, "styles.css", false, "excludes css file"],
    ])("with config %j, path \"%s\" should return %s (%s)", (config, path, expected) => {
      const filter = createPathFilter(config);
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
      const filter = createPathFilter({
        include: ["**/*.{js,ts,jsx,tsx,vue,svelte}"],
        exclude: [
          "**/node_modules/**",
          "**/dist/**",
          "**/build/**",
          "**/*.test.*",
          "**/*.spec.*",
        ],
      });

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
      const filter = createPathFilter({
        include: ["**/*.{md,mdx,txt}"],
        exclude: [
          "**/node_modules/**",
          "**/README.md",
        ],
      });

      expect(filter(path)).toBe(expected);
    });
  });

  describe("edge cases and special patterns", () => {
    it.each([
      // case should always match
      [["*.TXT"], "file.txt", true, "doesn't match different case"],
      [["*.txt"], "FILE.TXT", true, "doesn't match different case reverse"],
      [["SRC/**"], "src/file.js", true, "matches directory different case"],

      // dot files (dot: true option)
      [[".*"], ".gitignore", true, "matches dot files"],
      [[".*"], ".env", true, "matches env file"],
      [[".*"], "file.txt", false, "does not match regular files with dot pattern"],
      [["**/.git/**"], ".git/config", true, "matches hidden directories"],
    ])("with include %j, path \"%s\" should return %s (%s)", (include, path, expected) => {
      const filter = createPathFilter({ include });
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
    ])("edge case: include %j, path \"%s\" should return %s (%s)", (include, path, expected) => {
      const filter = createPathFilter({ include });
      expect(filter(path)).toBe(expected);
    });
  });

  describe("pattern precedence", () => {
    it("should handle include and exclude patterns correctly", () => {
      // exclude patterns should override include patterns
      const filter1 = createPathFilter({
        include: ["*.js"],
        exclude: ["test.js"],
      });
      expect(filter1("index.js")).toBe(true);
      expect(filter1("test.js")).toBe(false);

      // behavior is now consistent regardless of pattern order
      const filter2 = createPathFilter({
        include: ["*.js"],
        exclude: ["test.js"],
      });
      expect(filter2("index.js")).toBe(true);
      expect(filter2("test.js")).toBe(false);
    });

    it.each([
      // more specific excludes should work with broader includes
      [{ include: ["**/*.js"], exclude: ["**/test/**/*.js"] }, "src/index.js", true],
      [{ include: ["**/*.js"], exclude: ["**/test/**/*.js"] }, "test/unit/spec.js", false],
      [{ include: ["**/*.js"], exclude: ["**/test/**/*.js"] }, "src/test.js", true], // test.js not in test/ dir

      // multiple overlapping excludes
      [{ include: ["src/**"], exclude: ["src/temp/**", "src/**/*.log"] }, "src/file.js", true],
      [{ include: ["src/**"], exclude: ["src/temp/**", "src/**/*.log"] }, "src/temp/file.js", false],
      [{ include: ["src/**"], exclude: ["src/temp/**", "src/**/*.log"] }, "src/debug.log", false],
      [{ include: ["src/**"], exclude: ["src/temp/**", "src/**/*.log"] }, "src/temp/debug.log", false],
    ])("pattern precedence: config %j, path \"%s\" should return %s", (config, path, expected) => {
      const filter = createPathFilter(config);

      expect(filter(path)).toBe(expected);
    });

    it("should handle mixed include and exclude patterns predictably", () => {
      const filter = createPathFilter({
        include: ["**/*.txt"],
        exclude: ["**/extracted/**"],
      });

      expect(filter("file.txt")).toBe(true);
      expect(filter("extracted/file.txt")).toBe(false); // now excluded as expected
      expect(filter("extracted/nested/file.txt")).toBe(false); // now excluded as expected
      expect(filter("other/file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);
    });
  });

  describe("disableDefaultExclusions option", () => {
    it("should not exclude default patterns when disableDefaultExclusions is true", () => {
      const filter = createPathFilter({ disableDefaultExclusions: true });
      expect(filter("file.zip")).toBe(true);
      expect(filter("file.pdf")).toBe(true);
      expect(filter("file.txt")).toBe(true);
    });

    it("should still apply custom filters when disableDefaultExclusions is true", () => {
      const filter = createPathFilter({
        exclude: ["*.txt"],
        disableDefaultExclusions: true,
      });
      expect(filter("file.txt")).toBe(false);
      expect(filter("file.zip")).toBe(true);
      expect(filter("file.pdf")).toBe(true);
    });
  });

  describe("extend functionality", () => {
    it("should extend filters with additional patterns", () => {
      const filter = createPathFilter({
        include: ["*.txt"],
        exclude: ["*Test*"],
      });

      // initial behavior
      expect(filter("Data.txt")).toBe(true);
      expect(filter("DataTest.txt")).toBe(false);
      expect(filter("file.js")).toBe(false);

      // extend with additional exclusions
      filter.extend({ exclude: ["*.txt"] });

      // new behavior after extension
      expect(filter("Data.txt")).toBe(false); // now excluded
      expect(filter("DataTest.txt")).toBe(false); // still excluded
      expect(filter("file.js")).toBe(false); // still excluded
    });

    it("should extend with include patterns", () => {
      const filter = createPathFilter({ include: ["*.txt"] });

      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);
      expect(filter("file.md")).toBe(false);

      filter.extend({ include: ["*.js", "*.md"] });

      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(true); // now included
      expect(filter("file.md")).toBe(true); // now included
      expect(filter("file.css")).toBe(false); // still excluded
    });

    it("should extend with mixed include and exclude patterns", () => {
      const filter = createPathFilter({ include: ["src/**"] });

      expect(filter("src/file.js")).toBe(true);
      expect(filter("src/test.js")).toBe(true);
      expect(filter("lib/file.js")).toBe(false);

      filter.extend({ include: ["lib/**"], exclude: ["**/test.*"] });

      expect(filter("src/file.js")).toBe(true);
      expect(filter("src/test.js")).toBe(false); // now excluded by new pattern
      expect(filter("lib/file.js")).toBe(true); // now included
      expect(filter("lib/test.js")).toBe(false); // excluded by new pattern
    });

    it("should handle multiple extensions", () => {
      const filter = createPathFilter({ include: ["*.txt"] });

      filter.extend({ include: ["*.js"] });
      filter.extend({ exclude: ["*test*"] });
      filter.extend({ include: ["*.md"] });

      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(true);
      expect(filter("file.md")).toBe(true);
      expect(filter("test.txt")).toBe(false); // excluded by third extension
      expect(filter("test.js")).toBe(false); // excluded by third extension
      expect(filter("file.css")).toBe(false); // never included
    });

    it("should extend empty filter", () => {
      const filter = createPathFilter({});

      // initially allows everything
      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(true);

      filter.extend({ include: ["*.txt"] });

      // now only allows txt files
      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);
    });

    it("should extend with empty config (no-op)", () => {
      const filter = createPathFilter({ include: ["*.txt"] });

      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);

      filter.extend({});

      // behavior should remain the same
      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(false);
    });

    it("should work with more complex structure", () => {
      // start with basic source files
      const filter = createPathFilter({ include: ["src/**/*.{js,ts}"] });

      expect(filter("src/index.js")).toBe(true);
      expect(filter("src/utils.ts")).toBe(true);
      expect(filter("src/style.css")).toBe(false);
      expect(filter("test/spec.js")).toBe(false);

      // add test files
      filter.extend({ include: ["test/**/*.{js,ts}"] });

      expect(filter("src/index.js")).toBe(true);
      expect(filter("test/spec.js")).toBe(true); // now included
      expect(filter("test/style.css")).toBe(false); // still excluded

      // exclude node_modules and dist
      filter.extend({ exclude: ["**/node_modules/**", "**/dist/**"] });

      expect(filter("src/index.js")).toBe(true);
      expect(filter("test/spec.js")).toBe(true);
      expect(filter("node_modules/lib/index.js")).toBe(false); // now excluded
      expect(filter("dist/bundle.js")).toBe(false); // now excluded
    });

    it("should handle extending with duplicate patterns", () => {
      const filter = createPathFilter({ include: ["*.txt"] });

      filter.extend({ include: ["*.txt", "*.js"] }); // duplicate *.txt
      filter.extend({ include: ["*.js"] }); // duplicate *.js

      const config = filter.patterns();
      expect(config.include).toEqual(expect.arrayContaining([
        "*.txt",
        "*.txt",
        "*.js",
        "*.js",
      ]));
      expect(filter("file.txt")).toBe(true);
      expect(filter("file.js")).toBe(true);
    });

    it("should handle extending with conflicting patterns", () => {
      const filter = createPathFilter({ include: ["*.txt"] });

      // add conflicting pattern
      filter.extend({ exclude: ["*.txt"] });

      // exclusion should take precedence
      expect(filter("file.txt")).toBe(false);
    });
  });

  describe("patterns functionality", () => {
    it("should return initial config", () => {
      const initialConfig = { include: ["*.txt"], exclude: ["*Test*"] };
      const filter = createPathFilter(initialConfig);

      expect(filter.patterns()).toEqual(expect.objectContaining({
        include: ["*.txt"],
        exclude: ["*Test*"],
      }));
    });

    it("should return updated config after extension", () => {
      const filter = createPathFilter({ include: ["*.txt"] });

      expect(filter.patterns()).toEqual(expect.objectContaining({
        include: ["*.txt"],
      }));

      filter.extend({ include: ["*.js"], exclude: ["*test*"] });

      expect(filter.patterns()).toEqual(expect.objectContaining({
        include: ["*.txt", "*.js"],
        exclude: ["*test*"],
      }));
    });

    it("prevent mutating config using patterns", () => {
      const filter = createPathFilter({ include: ["*.txt"] });

      const config = filter.patterns();

      config.include?.push("*.js"); // try to mutate the returned config

      expect(filter.patterns()).toEqual(expect.objectContaining({
        include: ["*.txt"],
      })); // should not be affected
      expect(filter("file.js")).toBe(false); // filter behavior should not change
    });

    it("should track multiple extensions correctly", () => {
      const filter = createPathFilter({ include: ["*.txt"] });

      filter.extend({ include: ["*.js"] });
      expect(filter.patterns()).toEqual(expect.objectContaining({
        include: ["*.txt", "*.js"],
      }));

      filter.extend({ exclude: ["*test*"] });
      expect(filter.patterns()).toEqual(expect.objectContaining({
        include: ["*.txt", "*.js"],
        exclude: ["*test*"],
      }));

      filter.extend({ include: ["*.md", "*.css"] });
      expect(filter.patterns()).toEqual(expect.objectContaining({
        include: ["*.txt", "*.js", "*.md", "*.css"],
        exclude: ["*test*"],
      }));
    });

    it("should handle empty initial config", () => {
      const filter = createPathFilter({});

      expect(filter.patterns()).toEqual({});

      filter.extend({ include: ["*.txt"] });
      expect(filter.patterns()).toEqual(expect.objectContaining({
        include: ["*.txt"],
      }));
    });
  });

  describe("extraConfig parameter", () => {
    it.each([
      // basic extra include filters
      {
        baseConfig: { include: ["*.txt"] },
        path: "file.txt",
        extraConfig: { include: ["*.js"] },
        expected: true,
        description: "base filter still matches",
      },
      {
        baseConfig: { include: ["*.txt"] },
        path: "file.js",
        extraConfig: { include: ["*.js"] },
        expected: true,
        description: "extra include filter works",
      },
      {
        baseConfig: { include: ["*.txt"] },
        path: "file.css",
        extraConfig: { include: ["*.js"] },
        expected: false,
        description: "matches neither base nor extra",
      },

      // extra exclude filters
      {
        baseConfig: { include: ["**/*.txt"] },
        path: "file.txt",
        extraConfig: { exclude: ["*test*"] },
        expected: true,
        description: "not matching extra exclude",
      },
      {
        baseConfig: { include: ["**/*.txt"] },
        path: "test.txt",
        extraConfig: { exclude: ["*test*"] },
        expected: false,
        description: "matching extra exclude",
      },
      {
        baseConfig: { include: ["**/*.txt"] },
        path: "file.js",
        extraConfig: { exclude: ["*test*"] },
        expected: false,
        description: "doesn't match base, extra irrelevant",
      },

      // multiple extra filters
      {
        baseConfig: { include: ["*.txt"] },
        path: "file.txt",
        extraConfig: { include: ["*.js", "*.md"] },
        expected: true,
        description: "matches base with multiple extras",
      },
      {
        baseConfig: { include: ["*.txt"] },
        path: "file.js",
        extraConfig: { include: ["*.js", "*.md"] },
        expected: true,
        description: "matches first extra",
      },
      {
        baseConfig: { include: ["*.txt"] },
        path: "file.md",
        extraConfig: { include: ["*.js", "*.md"] },
        expected: true,
        description: "matches second extra",
      },
      {
        baseConfig: { include: ["*.txt"] },
        path: "file.css",
        extraConfig: { include: ["*.js", "*.md"] },
        expected: false,
        description: "matches none",
      },

      // complex base with extra filters
      {
        baseConfig: { include: ["src/**/*.js"] },
        path: "src/index.js",
        extraConfig: { include: ["lib/**/*.js"] },
        expected: true,
        description: "base still works with extra",
      },
      {
        baseConfig: { include: ["src/**/*.js"] },
        path: "lib/index.js",
        extraConfig: { include: ["lib/**/*.js"] },
        expected: true,
        description: "extra expands base",
      },
      {
        baseConfig: { include: ["src/**/*.js"] },
        path: "src/style.css",
        extraConfig: { include: ["lib/**/*.js"] },
        expected: false,
        description: "wrong extension",
      },
      {
        baseConfig: { include: ["src/**/*.js"] },
        path: "lib/style.css",
        extraConfig: { include: ["lib/**/*.js"] },
        expected: false,
        description: "wrong extension in extra",
      },

      // mixed include/exclude in extras
      {
        baseConfig: { include: ["src/**"] },
        path: "src/index.js",
        extraConfig: { include: ["lib/**"], exclude: ["**/test.*"] },
        expected: true,
        description: "base + extra, not test",
      },
      {
        baseConfig: { include: ["src/**"] },
        path: "src/test.js",
        extraConfig: { include: ["lib/**"], exclude: ["**/test.*"] },
        expected: false,
        description: "base but matches exclude",
      },
      {
        baseConfig: { include: ["src/**"] },
        path: "lib/index.js",
        extraConfig: { include: ["lib/**"], exclude: ["**/test.*"] },
        expected: true,
        description: "extra, not test",
      },
      {
        baseConfig: { include: ["src/**"] },
        path: "lib/test.js",
        extraConfig: { include: ["lib/**"], exclude: ["**/test.*"] },
        expected: false,
        description: "extra but matches exclude",
      },

      // empty extra config (should behave like base only)
      {
        baseConfig: { include: ["*.txt"] },
        path: "file.txt",
        extraConfig: {},
        expected: true,
        description: "empty extra config, matches base",
      },
      {
        baseConfig: { include: ["*.txt"] },
        path: "file.js",
        extraConfig: {},
        expected: false,
        description: "empty extra config, doesn't match base",
      },

      // default exclusions with extra filters
      {
        baseConfig: { include: ["**/*"] },
        path: "file.txt",
        extraConfig: { exclude: ["*.txt"] },
        expected: false,
        description: "extra exclusion overrides base",
      },
      {
        baseConfig: { include: ["**/*"] },
        path: "file.zip",
        extraConfig: { exclude: ["*.txt"] },
        expected: false,
        description: "default exclusion still applies",
      },
      {
        baseConfig: { include: ["**/*"] },
        path: "file.js",
        extraConfig: { exclude: ["*.txt"] },
        expected: true,
        description: "not excluded by either",
      },
    ])("$description: base $baseConfig, path '$path', extra $extraConfig should return $expected", ({ baseConfig, path, extraConfig, expected }) => {
      const filter = createPathFilter(baseConfig);
      expect(filter(path, extraConfig)).toBe(expected);
    });

    it("should handle complex real-world scenario with extra config", () => {
      const filter = createPathFilter({ include: ["src/**/*.{js,ts,tsx}"] });

      // Scenario 1: Add test files temporarily
      const withTests = { include: ["test/**/*.{js,ts}"] };
      expect(filter("src/index.ts", withTests)).toBe(true);
      expect(filter("test/spec.ts", withTests)).toBe(true);
      expect(filter("test/style.css", withTests)).toBe(false);

      // Scenario 2: Exclude generated files
      const excludeGenerated = { exclude: ["**/*.generated.*"] };
      expect(filter("src/index.ts", excludeGenerated)).toBe(true);
      expect(filter("src/api.generated.ts", excludeGenerated)).toBe(false);

      // Scenario 3: Complex combination
      const complexExtra = { include: ["test/**/*.ts"], exclude: ["**/*.generated.*", "**/*.spec.*"] };
      expect(filter("src/index.ts", complexExtra)).toBe(true);
      expect(filter("test/utils.ts", complexExtra)).toBe(true);
      expect(filter("test/component.spec.ts", complexExtra)).toBe(false);
      expect(filter("src/api.generated.ts", complexExtra)).toBe(false);
    });

    it("should handle extra config when disableDefaultExclusions is enabled", () => {
      const filter = createPathFilter({ include: ["**/*"], disableDefaultExclusions: true });

      expect(filter("file.zip")).toBe(true);
      expect(filter("file.pdf")).toBe(true);
      expect(filter("file.zip", { exclude: ["*.zip"] })).toBe(false);
      expect(filter("file.pdf", { exclude: ["*.zip"] })).toBe(true);
    });
  });

  describe("implementation details", () => {
    it("should have extend method", () => {
      const filter = createPathFilter({ include: ["*.txt"] });
      expect(typeof filter.extend).toBe("function");
    });

    it("should have patterns method", () => {
      const filter = createPathFilter({ include: ["*.txt"] });
      expect(typeof filter.patterns).toBe("function");
    });
  });
});

describe("filterTreeStructure", () => {
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

  describe("basic filtering", () => {
    it("should filter files based on extension", () => {
      const filter = createPathFilter({ include: ["**/*.json"] });
      const result = filterTreeStructure(filter, tree);

      expect(result).toEqual([
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
              name: "config.json",
              path: "config.json",
            },
          ],
        },
      ]);
    });

    it("should include all items when no filters are applied", () => {
      const filter = createPathFilter();
      const result = filterTreeStructure(filter, tree);

      expect(result).toEqual(tree);
    });

    it("should filter out files that don't match include pattern", () => {
      const filter = createPathFilter({
        include: ["**/*.txt"],
      });
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
  });

  describe("directory inclusion logic", () => {
    it("should include directories that contain matching files", () => {
      const filter = createPathFilter({ include: ["**/DeepFile.txt"] });
      const result = filterTreeStructure(filter, tree);

      expect(result).toEqual([
        {
          type: "directory",
          name: "extracted",
          path: "extracted",
          children: [
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

    it("should exclude directories with no matching children", () => {
      const filter = createPathFilter({ include: ["**/*.nonexistent"] });
      const result = filterTreeStructure(filter, tree);

      expect(result).toEqual([]);
    });

    it("should include directory if directory path itself matches", () => {
      const filter = createPathFilter({ include: ["extracted/**"] });
      const result = filterTreeStructure(filter, tree);

      expect(result).toEqual([
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
      ]);
    });
  });

  describe("edge cases", () => {
    it("should handle empty tree", () => {
      const filter = createPathFilter({ include: ["**/*"] });
      const result = filterTreeStructure(filter, []);

      expect(result).toHaveLength(0);
    });

    it("should handle tree with only files", () => {
      const tree: TreeEntry[] = [
        { type: "file", name: "file1.txt", path: "file1.txt" },
        { type: "file", name: "file2.pdf", path: "file2.pdf" },
        { type: "file", name: "file3.md", path: "file3.md" },
      ];

      const filter = createPathFilter({ include: ["*.txt"] });
      const result = filterTreeStructure(filter, tree);

      expect(result).toEqual([
        { type: "file", name: "file1.txt", path: "file1.txt" },
      ]);
    });

    it("should handle deeply nested structure", () => {
      const nestedTree: TreeEntry[] = [
        {
          type: "directory",
          name: "a",
          path: "a",
          children: [
            {
              type: "directory",
              name: "b",
              path: "b",
              children: [
                {
                  type: "directory",
                  name: "c",
                  path: "c",
                  children: [
                    { type: "file", name: "deep.txt", path: "deep.txt" },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const filter = createPathFilter({ include: ["**/deep.txt"] });
      const result = filterTreeStructure(filter, nestedTree);

      expect(result).toEqual([
        {
          type: "directory",
          name: "a",
          path: "a",
          children: [
            {
              type: "directory",
              name: "b",
              path: "b",
              children: [
                {
                  type: "directory",
                  name: "c",
                  path: "c",
                  children: [
                    { type: "file", name: "deep.txt", path: "deep.txt" },
                  ],
                },
              ],
            },
          ],
        },
      ]);
    });

    it("should handle filter that matches nothing", () => {
      const filter = createPathFilter({ include: ["**/*.nonexistent"] });
      const result = filterTreeStructure(filter, tree);

      expect(result).toEqual([]);
    });
  });

  describe("path construction", () => {
    it("should correctly construct full paths for filtering", () => {
      const filter = createPathFilter({ include: ["extracted/nested/DeepFile.txt"] });
      const result = filterTreeStructure(filter, tree);

      expect(result).toEqual([
        {
          type: "directory",
          name: "extracted",
          path: "extracted",
          children: [
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

    it("should handle exclude patterns correctly", () => {
      const filter = createPathFilter({
        include: ["**/*"],
        exclude: ["extracted/nested/debug.log"],
      });
      const result = filterTreeStructure(filter, tree);

      expect(result).toEqual([
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
                // debug.log should be excluded
              ],
            },
          ],
        },
      ]);
    });

    it("should handle directory pattern matching file without extension", () => {
      const treeWithFileNoExt: TreeEntry[] = [
        {
          type: "file",
          name: "entry",
          path: "entry",
        },
        {
          type: "file",
          name: "entry.txt",
          path: "entry.txt",
        },
        {
          type: "directory",
          name: "entryDir",
          path: "entryDir",
          children: [
            {
              type: "file",
              name: "content.txt",
              path: "content.txt",
            },
          ],
        },
        {
          type: "directory",
          name: "other",
          path: "other",
          children: [
            {
              type: "file",
              name: "entry",
              path: "entry",
            },
          ],
        },
      ];

      const filter = createPathFilter({ exclude: ["**/entry"] });
      const result = filterTreeStructure(filter, treeWithFileNoExt);

      // The pattern "**/entry" should exclude:
      // - The file named "entry" (no extension)
      // - The nested file "other/entry"
      // But should NOT exclude:
      // - "entry.txt" (has extension)
      // - "entryDir" (different name)
      expect(result).toEqual([
        {
          type: "file",
          name: "entry.txt",
          path: "entry.txt",
        },
        {
          type: "directory",
          name: "entryDir",
          path: "entryDir",
          children: [
            {
              type: "file",
              name: "content.txt",
              path: "content.txt",
            },
          ],
        },
        {
          type: "directory",
          name: "other",
          path: "other",
          children: [],
        },
      ]);
    });
  });
});
