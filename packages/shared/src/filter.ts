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

type PathFilterFn = (path: string, extraFilters?: string[]) => boolean;

export interface PathFilter extends PathFilterFn {
  extend: (additionalFilters: string[]) => void;
  patterns: () => string[];
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
 * import { createPathFilter } from '@ucdjs/utils';
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
export function createPathFilter(filters: string[], options: FilterOptions = {}): PathFilter {
  let currentFilters = [...filters];
  let currentFilterFn = internal__createFilterFunction(currentFilters, options);

  function filterFn(path: string, extraFilters: string[] = []): boolean {
    if (extraFilters.length === 0) {
      return currentFilterFn(path);
    }

    const combinedFilter = createPathFilter([...currentFilters, ...extraFilters], options);
    return combinedFilter(path);
  }

  filterFn.extend = (additionalFilters: string[]): void => {
    currentFilters = [...currentFilters, ...additionalFilters];
    currentFilterFn = internal__createFilterFunction(currentFilters, options);
  };

  filterFn.patterns = (): string[] => {
    return [...currentFilters];
  };

  return filterFn;
}

function internal__createFilterFunction(filters: string[], options: FilterOptions): PathFilterFn {
  if (filters.length === 0) {
    return () => true;
  }

  // separate include and exclude patterns
  const includePatterns: string[] = [];
  const excludePatterns: string[] = options.disableDefaultExclusions
    ? []
    : [
        // exclude .zip & .pdf files by default
        "**/*.zip",
        "**/*.pdf",
      ];

  for (const filter of filters) {
    if (filter.startsWith("!")) {
      excludePatterns.push(filter.slice(1));
    } else {
      includePatterns.push(filter);
    }
  }

  // if no include patterns are specified, include everything by default
  const hasIncludePatterns = includePatterns.length > 0;
  const includeMatch = hasIncludePatterns
    ? picomatch(includePatterns, {
        dot: true,
        nocase: true,
      })
    : () => true;

  const excludeMatch = excludePatterns.length > 0
    ? picomatch(excludePatterns, {
        dot: true,
        nocase: true,
      })
    : () => false;

  return (path: string): boolean => {
    // first check if path matches include patterns (if any)
    if (!includeMatch(path)) {
      return false;
    }

    // then check if path matches exclude patterns
    return !excludeMatch(path);
  };
}
