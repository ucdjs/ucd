import type { PicomatchOptions } from "picomatch";
import { isMatch } from "picomatch";

/**
 * Predefined filter patterns for common file exclusions.
 * These constants can be used with `createPathFilter` to easily exclude common file types.
 *
 * @example
 * ```ts
 * import { createPathFilter, PRECONFIGURED_FILTERS } from '@ucdjs/shared';
 *
 * const filter = createPathFilter({
 *   include: ['*.txt'],
 *   exclude: [
 *     ...PRECONFIGURED_FILTERS.TEST_FILES,
 *     ...PRECONFIGURED_FILTERS.README_FILES
 *   ]
 * });
 * ```
 */
export const PRECONFIGURED_FILTERS = {
  /** Excludes files containing "Test" in their name (e.g., DataTest.txt, TestFile.js) */
  TEST_FILES: ["**/*Test*"],
  /** Excludes ReadMe.txt files from any directory */
  README_FILES: ["**/ReadMe.txt"],
  /** Excludes all HTML files */
  HTML_FILES: ["**/*.html"],
  /** Excludes test-related files */
  TEST_RELATED: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**"],
} as const;

type PathFilterFn = (path: string, extraOptions?: Pick<PathFilterOptions, "include" | "exclude">) => boolean;

export interface PathFilter extends PathFilterFn {
  extend: (additionalOptions: Pick<PathFilterOptions, "include" | "exclude">) => void;
  patterns: () => Readonly<PathFilterOptions>;
}

export interface PathFilterOptions {
  /**
   * Glob patterns for files to include.
   * If empty or not set, includes everything using "**" pattern
   */
  include?: string[];
  /**
   * Glob patterns for files to exclude.
   * These override include patterns
   */
  exclude?: string[];

  disableDefaultExclusions?: boolean;
}

/**
 * Creates a filter function that checks if a file path should be included or excluded
 * based on the provided filter configuration.
 *
 * @param {PathFilterOptions} options - Configuration object with include/exclude patterns
 * @returns {PathFilter} A function that takes a path and returns true if the path should be included, false otherwise
 *
 * @example
 * ```ts
 * import { createPathFilter, PRECONFIGURED_FILTERS } from '@ucdjs/shared';
 *
 * // Include specific files, exclude others
 * const filter = createPathFilter({
 *   include: ['src/**\/*.{js,ts}', 'test/**\/*.{test.js}'],
 *   exclude: ['**\/node_modules/**', '**\/*.generated.*']
 * });
 *
 * // If include is empty/not set, includes everything
 * const excludeOnly = createPathFilter({
 *   exclude: ['**\/node_modules/**', '**\/dist/**']
 * });
 *
 * // Using preconfigured filters
 * const withPresets = createPathFilter({
 *   include: ['src/**\/*.ts'],
 *   exclude: [
 *     ...PRECONFIGURED_FILTERS.TEST_RELATED,
 *     ...PRECONFIGURED_FILTERS.BUILD_DIRS
 *   ]
 * });
 * ```
 */
export function createPathFilter(options: PathFilterOptions = {}): PathFilter {
  let currentConfig = { ...options };
  let currentFilterFn = internal__createFilterFunction(currentConfig);

  function filterFn(path: string, extraOptions: Pick<PathFilterOptions, "include" | "exclude"> = {}): boolean {
    if (!extraOptions.include && !extraOptions.exclude) {
      return currentFilterFn(path);
    }

    const combinedOptions: PathFilterOptions = {
      include: Array.from(new Set([...(currentConfig.include || []), ...(extraOptions.include || [])])),
      exclude: Array.from(new Set([...(currentConfig.exclude || []), ...(extraOptions.exclude || [])])),
      disableDefaultExclusions: currentConfig.disableDefaultExclusions,
    };
    const combinedFilter = internal__createFilterFunction(combinedOptions);
    return combinedFilter(path);
  }

  filterFn.extend = (additionalOptions: Pick<PathFilterOptions, "include" | "exclude">): void => {
    currentConfig = {
      ...currentConfig,
      include: [...(currentConfig.include || []), ...(additionalOptions.include || [])],
      exclude: [...(currentConfig.exclude || []), ...(additionalOptions.exclude || [])],
    };

    currentFilterFn = internal__createFilterFunction(currentConfig);
  };

  filterFn.patterns = (): Readonly<PathFilterOptions> => {
    return Object.freeze(structuredClone(currentConfig));
  };

  return filterFn;
}

function internal__createFilterFunction(config: PathFilterOptions): PathFilterFn {
  // If include is empty or not set, include everything using "**" pattern
  const includePatterns = config.include || "**";

  const excludePatterns: string[] = config.disableDefaultExclusions
    ? [...(config.exclude || [])]
    : [
        // exclude .zip & .pdf files by default
        "**/*.zip",
        "**/*.pdf",
        ...(config.exclude || []),
      ];

  return (path: string): boolean => {
    const normalizedPath = path.startsWith("./") ? path.slice(2) : path;

    return isMatch(normalizedPath, includePatterns, {
      dot: true,
      nocase: true,
      ignore: excludePatterns,
    } satisfies PicomatchOptions);
  };
}

// TODO: Combine all "tree" related entries
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
  extraOptions: Pick<PathFilterOptions, "include" | "exclude"> = {},
): TreeEntry[] {
  return internal__filterTreeStructure(pathFilter, entries, "", extraOptions);
}

function internal__filterTreeStructure(
  pathFilter: PathFilter,
  entries: TreeEntry[],
  parentPath: string,
  extraOptions: Pick<PathFilterOptions, "include" | "exclude">,
): TreeEntry[] {
  const filteredEntries: TreeEntry[] = [];

  for (const entry of entries) {
    // Construct the full path by combining parent path with entry path
    const fullPath = parentPath ? `${parentPath}/${entry.path}` : entry.path;

    if (entry.type === "file") {
      // For files, simply check if the full path matches the filter
      if (pathFilter(fullPath, extraOptions)) {
        filteredEntries.push(entry);
      }
    } else if (entry.type === "directory") {
      // For directories, recursively filter children first
      const filteredChildren = internal__filterTreeStructure(pathFilter, entry.children, fullPath, extraOptions);

      // Include directory if:
      // 1. The directory itself matches the filter, OR
      // 2. It has children that match (even if directory doesn't match)
      const directoryMatches = pathFilter(fullPath, extraOptions);
      const hasMatchingChildren = filteredChildren.length > 0;

      if (directoryMatches || hasMatchingChildren) {
        filteredEntries.push({
          ...entry,
          children: filteredChildren,
        });
      }
    }
  }

  return filteredEntries;
}
