import type { UnicodeTreeNode } from "@ucdjs/fetch";
import { prependLeadingSlash } from "@luxass/utils";

/**
 * Recursively flattens a hierarchical file structure into an array of file paths.
 *
 * @param {UnicodeTreeNode[]} entries - Array of file tree nodes that may contain nested children
 * @param {string} [prefix] - Optional path prefix to prepend to each file path (default: "")
 * @returns {string[]} Array of flattened file paths as strings
 *
 * @example
 * ```typescript
 * import { flattenFilePaths } from "@ucdjs/utils";
 *
 * const files = [
 *   { name: "folder1", children: [{ name: "file1.txt" }] },
 *   { name: "file2.txt" }
 * ];
 * const paths = flattenFilePaths(files);
 * // Returns: ["folder1/file1.txt", "file2.txt"]
 * ```
 */
export function flattenFilePaths(entries: UnicodeTreeNode[], prefix: string = ""): string[] {
  const paths: string[] = [];

  if (!Array.isArray(entries)) {
    throw new TypeError("Expected 'entries' to be an array of UnicodeTreeNode");
  }

  for (const file of entries) {
    const fullPath = prefix
      ? `${prefix}${prependLeadingSlash(file.path ?? file.name)}`
      : (file.path ?? file.name);

    if (file.type === "directory") {
      paths.push(...flattenFilePaths(file.children, fullPath));
    } else {
      paths.push(fullPath);
    }
  }

  return paths;
}
