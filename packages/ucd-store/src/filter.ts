import picomatch from "picomatch";

export const PRECONFIGURED_FILTERS = {
  EXCLUDE_TEST_FILES: "!**/*Test*",
  // TODO: maybe also exclude README.txt
  EXCLUDE_README_FILES: "!**/Readme.txt",
  EXCLUDE_HTML_FILES: "!**/*.html",
} as const;

export type FilterFn = (path: string) => boolean;

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
 * @param {string[]} filters - Array of glob patterns to filter against. Patterns starting with '!' are exclusions.
 * @returns {FilterFn} A function that takes a path and returns true if the path should be included, false otherwise.
 *
 * @example
 * ```ts
 * const filter = createPathFilter(['*.txt', '!*Test*']);
 * filter('Data.txt'); // true
 * filter('DataTest.txt'); // false
 * ```
 */
export function createPathFilter(filters: string[], options: FilterOptions = {}): FilterFn {
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
