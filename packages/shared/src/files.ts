import type { UnicodeFileTreeNodeWithoutLastModified } from "@ucdjs/schemas";
import { prependLeadingSlash, trimLeadingSlash, trimTrailingSlash } from "@luxass/utils";
import { hasUCDFolderPath } from "@unicode-utils/core";

/**
 * Normalizes an API file-tree path to a version-relative path suitable for filtering.
 *
 * This strips:
 * - Leading/trailing slashes
 * - Version prefix (e.g., "16.0.0/")
 * - "ucd/" prefix for versions that have it
 *
 * @param {string} version - The Unicode version string
 * @param {string} rawPath - The raw path from the API file tree (e.g., "/16.0.0/ucd/Blocks.txt")
 * @returns {string} The normalized path (e.g., "Blocks.txt")
 *
 * @example
 * ```typescript
 * normalizePathForFiltering("16.0.0", "/16.0.0/ucd/Blocks.txt");
 * // Returns: "Blocks.txt"
 *
 * normalizePathForFiltering("16.0.0", "/16.0.0/ucd/auxiliary/GraphemeBreakProperty.txt");
 * // Returns: "auxiliary/GraphemeBreakProperty.txt"
 * ```
 */
export function normalizePathForFiltering(version: string, rawPath: string): string {
  // Strip leading and trailing slashes
  let path = trimTrailingSlash(trimLeadingSlash(rawPath));

  // Strip version prefix if present
  const versionPrefix = `${version}/`;
  if (path.startsWith(versionPrefix)) {
    path = path.slice(versionPrefix.length);
  }

  // Strip "ucd/" prefix for versions that have it
  if (hasUCDFolderPath(version) && path.startsWith("ucd/")) {
    path = path.slice(4);
  }

  return path;
}

/**
 * Creates a normalized view of a file tree for filtering purposes.
 *
 * This recursively maps all `path` properties to version-relative paths,
 * so that filter patterns like "Blocks.txt" or "auxiliary/**" will match
 * against paths like "/16.0.0/ucd/Blocks.txt".
 *
 * @template {UnicodeFileTreeNodeWithoutLastModified} T - A tree node type that extends the base TreeNode interface
 * @param {string} version - The Unicode version string
 * @param {T[]} entries - Array of file tree nodes from the API
 * @returns {T[]} A new tree with normalized paths suitable for filtering
 *
 * @example
 * ```typescript
 * const apiTree = [{ type: "file", name: "Blocks.txt", path: "/16.0.0/ucd/Blocks.txt" }];
 * const normalizedTree = normalizeTreeForFiltering("16.0.0", apiTree);
 * // Returns: [{ type: "file", name: "Blocks.txt", path: "Blocks.txt" }]
 * ```
 */
export function normalizeTreeForFiltering<T extends UnicodeFileTreeNodeWithoutLastModified>(
  version: string,
  entries: T[],
): T[] {
  return entries.map((entry) => {
    const normalizedPath = normalizePathForFiltering(version, entry.path);

    if (entry.type === "directory" && entry.children) {
      return {
        ...entry,
        path: normalizedPath,
        children: normalizeTreeForFiltering(version, entry.children),
      };
    }

    return {
      ...entry,
      path: normalizedPath,
    };
  });
}

/**
 * Recursively find a node (file or directory) by its path in the tree.
 *
 * @template T - A tree node type that extends the base TreeNode interface
 * @param {T[]} entries - Array of file tree nodes that may contain nested children
 * @param {string} targetPath - The path to search for
 * @returns {T | undefined} The found node or undefined
 */
export function findFileByPath<T extends UnicodeFileTreeNodeWithoutLastModified>(entries: T[], targetPath: string): T | undefined {
  for (const fileOrDirectory of entries) {
    // Use path property directly as it already contains the full path
    const filePath = fileOrDirectory.path ?? fileOrDirectory.name;

    // Check if this node matches the target path
    if (filePath === targetPath) {
      return fileOrDirectory;
    }

    // If it's a directory, also search in children
    if (fileOrDirectory.type === "directory" && fileOrDirectory.children) {
      const found = findFileByPath(fileOrDirectory.children as T[], targetPath);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * Recursively flattens a hierarchical file structure into an array of file paths.
 *
 * @template T - A tree node type that extends the base TreeNode interface
 * @param {T[]} entries - Array of file tree nodes that may contain nested children
 * @param {string} [prefix] - Optional path prefix to prepend to each file path (default: "")
 * @returns {string[]} Array of flattened file paths as strings
 *
 * @example
 * ```typescript
 * import { flattenFilePaths } from "@ucdjs-internal/shared";
 *
 * const files = [
 *   { type: "directory", name: "folder1", path: "/folder1", children: [{ type: "file", name: "file1.txt", path: "/folder1/file1.txt" }] },
 *   { type: "file", name: "file2.txt", path: "/file2.txt" }
 * ];
 * const paths = flattenFilePaths(files);
 * // Returns: ["/folder1/file1.txt", "/file2.txt"]
 * ```
 */
export function flattenFilePaths<T extends UnicodeFileTreeNodeWithoutLastModified>(entries: T[], prefix: string = ""): string[] {
  const paths: string[] = [];

  if (!Array.isArray(entries)) {
    throw new TypeError("Expected 'entries' to be an array of file tree nodes.");
  }

  for (const file of entries) {
    const fullPath = prefix
      ? `${prefix}${prependLeadingSlash(file.path)}`
      : file.path;

    if (file.type === "directory" && file.children) {
      paths.push(...flattenFilePaths(file.children, prefix));
    } else {
      paths.push(fullPath);
    }
  }

  return paths;
}
