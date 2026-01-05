import type { UnicodeFileTreeNodeWithoutLastModified } from "@ucdjs/schemas";
import { prependLeadingSlash } from "@luxass/utils";

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
