import picomatch from "picomatch";

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
export function createPathFilter(filters: string[] = [], options: FilterOptions = {}): PathFilter {
  const { disableDefaultExclusions = false } = options;

  // Start with initial filters, add defaults if not disabled
  const allPatterns: string[] = [...filters];
  if (!disableDefaultExclusions) {
    // Append default exclusions so they have highest priority (always win)
    allPatterns.push(...DEFAULT_EXCLUSIONS.map((pattern) => `!${pattern}`));
  }

  // Create the filter function
  const filterFn = ((path: string, extraFilters: string[] = []): boolean => {
    const combinedPatterns = [...allPatterns, ...extraFilters];

    // If no patterns are provided, include everything
    if (combinedPatterns.length === 0) {
      return true;
    }

    return matchesPatterns(path, combinedPatterns);
  }) as PathFilter;

  // Add the extend method
  filterFn.extend = (additionalFilters: string[]): void => {
    allPatterns.push(...additionalFilters);
  };

  // Add the patterns getter
  filterFn.patterns = (): readonly string[] => {
    return Object.freeze([...allPatterns]);
  };

  return filterFn;
}

function matchesPatterns(path: string, patterns: readonly string[]): boolean {
  // If no patterns, include everything
  if (patterns.length === 0) {
    return true;
  }

  // Check if we have any inclusion patterns (non-negated)
  const hasInclusionPatterns = patterns.some((pattern) => !pattern.startsWith("!"));

  // Default: if we have inclusion patterns, start with false (exclude by default)
  // If only exclusion patterns, start with true (include by default)
  let result = !hasInclusionPatterns;

  // Process patterns in order - later patterns override earlier ones
  for (const pattern of patterns) {
    const isNegated = pattern.startsWith("!");
    const cleanPattern = isNegated ? pattern.slice(1) : pattern;

    // Create matcher on-demand
    const matcher = picomatch(cleanPattern, {
      dot: true,
      nocase: true,
    });

    if (matcher(path)) {
      // If pattern matches, set result based on whether it's negated
      // This is where the "later patterns win" behavior happens
      result = !isNegated;
    }
  }

  return result;
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
  _pathFilter: PathFilter,
  _entries: TreeEntry[],
): TreeEntry[] {
  return [];
}
