import { prependLeadingSlash } from "@luxass/utils";

/**
 * A tree node structure that can be flattened.
 */
export interface TreeNode {
  /** The type of the node */
  type: string;
  /** The name of the node */
  name: string;
  /** The path of the node (optional, falls back to name) */
  path?: string;
  /** Child nodes (required for directory types) */
  children?: TreeNode[];
}

/**
 * Recursively find a file node by its path in the tree.
 *
 * @template T - A tree node type that extends the base TreeNode interface
 * @param {T[]} entries - Array of file tree nodes that may contain nested children
 * @param {string} targetPath - The path to search for
 * @param {string} [prefix] - Optional path prefix for recursive calls (default: "")
 * @returns {T | undefined} The found file node or undefined
 */
export function findFileByPath<T extends TreeNode>(entries: T[], targetPath: string, prefix: string = ""): T | undefined {
  for (const file of entries) {
    const fullPath = prefix
      ? `${prefix}/${file.path ?? file.name}`
      : (file.path ?? file.name);

    if (file.type === "directory" && file.children) {
      const found = findFileByPath(file.children as T[], targetPath, fullPath);
      if (found) {
        return found as T;
      }
    } else if (fullPath === targetPath || `/${fullPath}` === targetPath) {
      return file;
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
 *   { name: "folder1", type: "directory", children: [{ name: "file1.txt", type: "file" }] },
 *   { name: "file2.txt", type: "file" }
 * ];
 * const paths = flattenFilePaths(files);
 * // Returns: ["folder1/file1.txt", "file2.txt"]
 * ```
 */
export function flattenFilePaths<T extends TreeNode>(entries: T[], prefix: string = ""): string[] {
  const paths: string[] = [];

  if (!Array.isArray(entries)) {
    throw new TypeError("Expected 'entries' to be an array of TreeNode");
  }

  for (const file of entries) {
    const fullPath = prefix
      ? `${prefix}${prependLeadingSlash(file.path ?? file.name)}`
      : (file.path ?? file.name);

    if (file.type === "directory" && file.children) {
      paths.push(...flattenFilePaths(file.children, prefix));
    } else {
      paths.push(fullPath);
    }
  }

  return paths;
}
