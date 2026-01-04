import type { Entry } from "apache-autoindex-parse";
import { createGlobMatcher } from "@ucdjs-internal/shared";
import { parse } from "apache-autoindex-parse";

/**
 * Parses an HTML directory listing from Unicode.org and extracts file/directory entries.
 *
 * This function takes raw HTML content from a Unicode.org directory listing page
 * and converts it into a structured array of Entry objects containing metadata
 * about each file or subdirectory.
 *
 * @param {string} html - The raw HTML content from a Unicode.org directory listing page
 * @returns {Promise<Entry[]>} A promise that resolves to an array of Entry objects, each containing
 *          type, name, path, and lastModified information for files/directories
 *
 * @example
 * ```typescript
 * const html = await fetch('https://unicode.org/Public?F=2').then(r => r.text());
 * const entries = await parseUnicodeDirectory(html);
 * console.log(entries); // [{ type: 'directory', name: 'UNIDATA', path: '/UNIDATA', ... }]
 * ```
 */
export async function parseUnicodeDirectory(html: string, basePath = ""): Promise<Entry[]> {
  const files = parse(html, {
    format: "F2",
    basePath,
  });

  return files;
}

export interface DirectoryFilterOptions {
  /**
   * A string to filter file/directory names that start with this query (case-insensitive).
   */
  query?: string;

  /**
   * A glob pattern to filter file/directory names.
   */
  pattern?: string;

  /**
   * Type of entries to include: "all" (default), "files", or "directories".
   */
  type?: string;

  /**
   * Field to sort by: "name" (default) or "lastModified".
   */
  sort?: string;

  /**
   * Sort order: "asc" (default) or "desc".
   */
  order?: string;
}

/**
 * Applies filtering and sorting to directory entries based on query parameters.
 *
 * @param {Entry[]} files - Array of directory entries to filter and sort
 * @param {DirectoryFilterOptions} options - Filter and sort options
 * @returns {Entry[]} Filtered and sorted array of entries
 */
export function applyDirectoryFiltersAndSort(
  files: Entry[],
  options: DirectoryFilterOptions,
): Entry[] {
  let filtered = [...files];

  // Apply query filter (prefix search, case-insensitive)
  if (options.query) {
    // eslint-disable-next-line no-console
    console.info(`[v1_files]: applying query filter: ${options.query}`);
    const queryLower = options.query.toLowerCase();
    filtered = filtered.filter((entry) => entry.name.toLowerCase().startsWith(queryLower));
  }

  // Apply pattern filter if provided
  if (options.pattern) {
    // eslint-disable-next-line no-console
    console.info(`[v1_files]: applying glob pattern filter: ${options.pattern}`);
    const matcher = createGlobMatcher(options.pattern);
    filtered = filtered.filter((entry) => matcher(entry.name));
  }

  // Apply type filter
  const type = options.type || "all";
  if (type === "files") {
    filtered = filtered.filter((entry) => entry.type === "file");
  } else if (type === "directories") {
    filtered = filtered.filter((entry) => entry.type === "directory");
  }

  // Apply sorting (directories always first, like Windows File Explorer)
  const sort = options.sort || "name";
  const order = options.order || "asc";

  filtered = filtered.toSorted((a, b) => {
    // Directories always come first
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }

    // Within same type, apply the requested sort
    let comparison: number;

    if (sort === "lastModified") {
      // lastModified is always available from parseUnicodeDirectory
      comparison = (a.lastModified ?? 0) - (b.lastModified ?? 0);
    } else {
      // Natural name sorting (numeric aware) so 2.0.0 < 10.0.0
      comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    }

    return order === "desc" ? -comparison : comparison;
  });

  return filtered;
}
