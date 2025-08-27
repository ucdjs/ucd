import type { PicomatchOptions } from "picomatch";
import picomatch from "picomatch";
import { flattenFilePaths } from "./flatten";

/**
 * Predefined filter patterns for common file exclusions.
 * These constants can be used with `createPathFilter` to easily exclude common file types.
 *
 * @example
 * ```ts
 * import { createPathFilter, PRECONFIGURED_FILTERS } from '@ucdjs/shared';
 *
 * const filter = createPathFilter([
 *   '*.txt',
 *   PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES,
 *   PRECONFIGURED_FILTERS.EXCLUDE_README_FILES
 * ]);
 * ```
 */
export const PRECONFIGURED_FILTERS = {
  /** Excludes files containing "Test" in their name (e.g., DataTest.txt, TestFile.js) */
  EXCLUDE_TEST_FILES: "!**/*Test*",
  /** Excludes ReadMe.txt files from any directory */
  EXCLUDE_README_FILES: "!**/ReadMe.txt",
  /** Excludes all HTML files */
  EXCLUDE_HTML_FILES: "!**/*.html",
} as const;

export const DEFAULT_EXCLUSIONS: readonly string[] = [
  "**/*.zip",
  "**/*.pdf",
  "**/.DS_Store",
] as const;

const FILE_EXTENSION_PATTERN = /\*\.([^/]+)$/;
const DIRECTORY_EXPANSION_SUFFIX = "{,/**}";
const DOUBLE_ASTERISK_PATTERN = "/**";
const GLOB_TOKEN_PATTERN = /[*?[\]{}()]/;

type PathFilterFn = (path: string, extraFilters?: string[]) => boolean;

export interface PathFilter extends PathFilterFn {
  extend: (additionalFilters: string[]) => void;
  patterns: () => readonly string[];
}

export interface FilterOptions {
  /**
   * Whether or not to disable the default exclusions.
   * By default, the filter excludes certain file types like `.zip` and `.pdf`.
   */
  disableDefaultExclusions?: boolean;
}

const PICOMATCH_DEFAULT_OPTIONS = {
  dot: true,
} satisfies PicomatchOptions;

/**
 * Creates a filter function that checks if a file path should be included or excluded
 * based on the provided filter patterns.
 *
 * @param {string[]} filters - Array of glob patterns to filter against
 * @param {FilterOptions} options - Configuration options
 * @returns {PathFilter} A function that takes a path and returns true if the path should be included, false otherwise
 *
 *  NOTE:
 * - **Include patterns**: Patterns WITHOUT `!` prefix specify which files to INCLUDE
 * - **Exclude patterns**: Patterns WITH `!` prefix specify which files to EXCLUDE
 * - **Default behavior**: If no include patterns are provided, ALL files are included by default
 * - **Precedence**: Exclude patterns override include patterns
 * - **Default exclusions**: `.zip` and `.pdf` files are excluded by default (unless disabled)
 *
 * @example
 * ```ts
 * import { createPathFilter } from '@ucdjs/shared';
 *
 * // Include only .txt files, exclude any with "Test" in the name
 * const filter = createPathFilter(['*.txt', '!*Test*']);
 * filter('Data.txt');     // true  - matches *.txt, doesn't match !*Test*
 * filter('DataTest.txt'); // false - matches *.txt but also matches !*Test*
 * filter('Data.js');      // false - doesn't match *.txt
 *
 * // Include everything in src/, exclude test files
 * const srcFilter = createPathFilter(['src/**', '!**\/*.test.*']);
 * srcFilter('src/index.js');      // true  - in src/, not a test file
 * srcFilter('src/utils.test.js'); // false - in src/ but is a test file
 * srcFilter('lib/index.js');      // false - not in src/
 *
 * // Exclude specific directories (no include patterns = include everything else)
 * const excludeFilter = createPathFilter(['!**\/node_modules/**', '!**\/dist/**']);
 * excludeFilter('src/index.js');           // true  - not in excluded dirs
 * excludeFilter('node_modules/lib/a.js');  // false - in excluded dir
 * excludeFilter('dist/bundle.js');         // false - in excluded dir
 *
 * // Include only extracted files
 * const extractedOnly = createPathFilter(['**\/extracted/**']);
 * extractedOnly('extracted/data.txt');         // true  - matches pattern
 * extractedOnly('src/extracted/data.txt');     // true  - matches pattern
 * extractedOnly('src/data.txt');               // false - doesn't match pattern
 * ```
 */
export function createPathFilter(
  filters: string[] = [],
  options: FilterOptions = {},
): PathFilter {
  let basePatterns = [...filters];
  let baseRules = buildRules(basePatterns);

  function filter(path: string, extraFilters?: string[]): boolean {
    // handle empty/invalid inputs - return true (neutral, avoid surprising denials)
    if (typeof path !== "string" || path.length === 0) {
      return true;
    }

    const normalizedPath = normalizeToPosix(path);

    // determine which rules to use - combine base + extras if provided
    const rules = extraFilters && extraFilters.length > 0
      ? buildRules([...basePatterns, ...extraFilters])
      : baseRules;

    // check if path matches any active (non-overridden) default exclusions first
    if (!options.disableDefaultExclusions) {
      const allUserPatterns = extraFilters && extraFilters.length > 0
        ? [...basePatterns, ...extraFilters]
        : basePatterns;

      for (const defaultPattern of DEFAULT_EXCLUSIONS) {
        // check if this default is specifically overridden
        let isOverridden = false;
        for (const userPattern of allUserPatterns) {
          if (userPattern && !userPattern.startsWith("!") && patternOverridesDefault(userPattern, defaultPattern)) {
            isOverridden = true;
            break;
          }
        }

        // if not overridden and path matches, exclude it
        if (!isOverridden) {
          const expandedDefault = expandDirectoryPattern(`!${defaultPattern}`);
          const cleanDefault = expandedDefault.slice(1);
          const defaultTest = picomatch(cleanDefault, PICOMATCH_DEFAULT_OPTIONS);
          if (defaultTest(normalizedPath)) {
            return false;
          }
        }
      }
    }

    // Inclusive by default: if any positives exist, start with deny; otherwise allow
    let allowed = !rules.hasAnyPositive;

    // Evaluate user rules in order - last matching rule wins
    for (const rule of rules.ordered) {
      if (rule.test(normalizedPath)) {
        allowed = rule.positive;
      }
    }

    return allowed;
  }

  // add extend method to append additional patterns
  filter.extend = (additionalFilters: string[]) => {
    basePatterns = [...basePatterns, ...additionalFilters];
    baseRules = buildRules(basePatterns);
  };

  // add patterns method to get current base patterns
  filter.patterns = () => Object.freeze([...basePatterns]);

  return filter;
}

/**
 * Expands directory patterns to include both the directory itself and all its descendants.
 * This function handles the automatic expansion of directory-like patterns to make them
 * work correctly with glob matching.
 *
 * @param {string} pattern - The glob pattern to expand. Can be negated (starting with "!") or positive.
 *
 * @returns {string} The expanded pattern that matches both the directory and its contents.
 *
 * @remarks
 * The function performs the following transformations:
 * - Patterns ending with "/" are treated as directories and expanded to include all descendants
 * - Patterns already ending with "/**" or "{,/**}" are left unchanged
 * - Patterns with glob tokens in the last segment are not expanded
 * - Negated patterns (starting with "!") preserve their negation prefix
 *
 * @example
 * ```ts
 * // Directory with trailing slash
 * expandDirectoryPattern("src/") // Returns "src{,/**}"
 * expandDirectoryPattern("!dist/") // Returns "!dist{,/**}"
 *
 * // Already expanded patterns (no change)
 * expandDirectoryPattern("src/**") // Returns "src/**"
 * expandDirectoryPattern("src{,/**}") // Returns "src{,/**}"
 *
 * // Patterns with glob tokens (no expansion)
 * expandDirectoryPattern("src/*.js") // Returns "src/*.js"
 * expandDirectoryPattern("src/test*") // Returns "src/test*"
 *
 * // Simple directory names get expanded
 * expandDirectoryPattern("node_modules") // Returns "node_modules{,/**}"
 * expandDirectoryPattern("!build") // Returns "!build{,/**}"
 * ```
 */
function expandDirectoryPattern(pattern: string): string {
  const isNegated = pattern.startsWith("!");
  const cleanPattern = isNegated ? pattern.slice(1) : pattern;

  // handle trailing slash - treat as directory expansion
  if (cleanPattern.endsWith("/")) {
    const base = cleanPattern.slice(0, -1);
    return `${(isNegated ? "!" : "") + base}${DIRECTORY_EXPANSION_SUFFIX}`;
  }

  // check if already ends with /** or {,/**} - no expansion needed
  if (cleanPattern.endsWith(DOUBLE_ASTERISK_PATTERN) || cleanPattern.endsWith(DIRECTORY_EXPANSION_SUFFIX)) {
    return pattern;
  }

  // get the last segment after final slash
  const lastSlashIndex = cleanPattern.lastIndexOf("/");
  const lastSegment = lastSlashIndex >= 0 ? cleanPattern.slice(lastSlashIndex + 1) : cleanPattern;

  // check if last segment contains glob tokens
  if (GLOB_TOKEN_PATTERN.test(lastSegment)) {
    return pattern; // Don't expand if contains glob tokens
  }

  // expand the pattern to include directory and all descendants
  return `${(isNegated ? "!" : "") + cleanPattern}${DIRECTORY_EXPANSION_SUFFIX}`;
}

interface Rule {
  test: (path: string) => boolean;
  positive: boolean;
  cleanPattern: string;
}

interface RuleSet {
  ordered: Rule[];
  hasAnyPositive: boolean;
}

/**
 * Build an ordered rule set from patterns
 */
function buildRules(patterns: string[]): RuleSet {
  const ordered: Rule[] = [];
  let hasAnyPositive = false;

  // Collect user patterns (defaults are handled separately in the filter function now)
  const userPatterns = patterns.filter((p) => p).map((p) => expandDirectoryPattern(p));

  // Add user patterns in order
  for (const pattern of userPatterns) {
    const isNegated = pattern.startsWith("!");
    const cleanPattern = isNegated ? pattern.slice(1) : pattern;

    ordered.push({
      test: picomatch(cleanPattern, PICOMATCH_DEFAULT_OPTIONS),
      positive: !isNegated,
      cleanPattern,
    });

    if (!isNegated) {
      hasAnyPositive = true;
    }
  }

  return { ordered, hasAnyPositive };
}

/**
 * Determines if a positive user pattern should override a default exclusion pattern.
 * This function is used to check whether a user's inclusive pattern should take precedence
 * over the built-in default exclusions (like `*.zip`, `*.pdf`, `.DS_Store`).
 *
 * @param {string} positivePattern - The user-provided positive (non-negated) pattern that includes files
 * @param {string} defaultPattern - The default exclusion pattern to check against
 * @returns {boolean} `true` if the positive pattern overrides the default, `false` otherwise
 *
 * @remarks
 * The function uses the following logic to determine overrides:
 * - **Exact match**: After normalizing both patterns by removing leading `**\/`, if they match exactly
 * - **Extension patterns**: For patterns containing `*.`, checks if both target the same file extension
 * - **Special files**: For `.DS_Store`, checks for exact filename match in both patterns
 *
 * @example
 * ```ts
 * // Extension pattern override
 * patternOverridesDefault('*.zip', '**\/*.zip'); // true - same extension
 * patternOverridesDefault('*.txt', '**\/*.zip'); // false - different extensions
 *
 * // Exact pattern override
 * patternOverridesDefault('*.pdf', '*.pdf'); // true - exact match
 * patternOverridesDefault('docs/*.pdf', '**\/*.pdf'); // true - same extension
 *
 * // Special file override
 * patternOverridesDefault('**\/.DS_Store', '**\/.DS_Store'); // true - exact match
 * patternOverridesDefault('src/.DS_Store', '**\/.DS_Store'); // true - both contain .DS_Store
 *
 * // No override cases
 * patternOverridesDefault('*.txt', '*.zip'); // false - different extensions
 * patternOverridesDefault('src/**', '*.pdf'); // false - no common pattern
 * ```
 */
function patternOverridesDefault(positivePattern: string, defaultPattern: string): boolean {
  // remove leading "**/" from both patterns if present for comparison
  const normalizeForComparison = (p: string): string => p.replace(/^\*\*\//, "");

  const normalizedPositive = normalizeForComparison(positivePattern);
  const normalizedDefault = normalizeForComparison(defaultPattern);

  // exact match after normalization (e.g., "*.zip" matches "*.zip")
  if (normalizedPositive === normalizedDefault) {
    return true;
  }

  // for extension patterns, check if positive specifically targets the same extension
  if (defaultPattern.includes("*.") && positivePattern.includes("*.")) {
    const defaultExt = defaultPattern.match(FILE_EXTENSION_PATTERN)?.[1];
    const positiveExt = positivePattern.match(FILE_EXTENSION_PATTERN)?.[1];
    return defaultExt === positiveExt;
  }

  // for .DS_Store, check exact match
  if (defaultPattern.includes(".DS_Store") && positivePattern.includes(".DS_Store")) {
    return true;
  }

  return false;
}

function normalizeToPosix(path: string): string {
  return path.includes("\\") ? path.replace(/\\/g, "/") : path;
}

export type TreeEntry = {
  type: "file";
  name: string;
  path: string;
} | {
  type: "directory";
  name: string;
  path: string;
  children: TreeEntry[];
};

export function filterTreeStructure(
  pathFilter: PathFilter,
  entries: TreeEntry[],
): TreeEntry[] {
  const filtered: TreeEntry[] = [];

  const flattened = flattenFilePaths(entries);

  const matches = [];

  for (const filePath of flattened) {
    if (pathFilter(filePath)) {
      matches.push(filePath);
    }
  }

  // build the tree again, using the string matches

  for (const match of matches) {
    const [root, ...rest] = match.split("/");

    if (root == null) {
      throw new Error(`Invalid match found: ${match}`);
    }

    let rootEntry = filtered.find((entry) => entry.name === root);

    const isDirectory = rest.length > 0;

    if (!rootEntry) {
      rootEntry = isDirectory
        ? {
            type: "directory" as const,
            name: root,
            path: root,
            children: [],
          }
        : {
            type: "file" as const,
            name: root,
            path: root,
          };

      filtered.push(rootEntry);
    }

    // use the rest to run recursively append it
    const appendRest = (parent: TreeEntry, rest: string[]): void => {
      if (rest.length === 0) return;

      const [next, ...remaining] = rest;

      if (next == null) {
        throw new Error(`Invalid match found: ${match}`);
      }

      // Type guard to ensure parent is a directory
      if (parent.type !== "directory") {
        throw new Error(`Cannot append children to file entry: ${parent.path}`);
      }

      let child = parent.children.find((entry: TreeEntry) => entry.name === next);

      if (!child) {
        child = remaining.length > 0
          ? {
              type: "directory" as const,
              name: next,
              path: next,
              children: [],
            }
          : {
              type: "file" as const,
              name: next,
              path: next,
            };
        parent.children.push(child);
      }

      appendRest(child, remaining);
    };

    if (rest.length > 0) {
      appendRest(rootEntry, rest);
    }
  }

  return filtered;
}
