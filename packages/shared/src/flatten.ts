import type { UnicodeTreeNode } from "@ucdjs/fetch";
import { prependLeadingSlash } from "@luxass/utils";

export interface FlattenFilePathsOptions {
  /**
   * Whether to include directory paths in the flattened output.
   * If true, directory paths will be included alongside file paths.
   *
   * @default false
   */
  includeDirectories?: boolean;
}

/**
 * Recursively flattens a hierarchical file structure into an array of file paths.
 *
 * @param {UnicodeTreeNode[]} entries - Array of file tree nodes that may contain nested children
 * @param {string} prefix - The current path prefix to apply to each file
 * @param {FlattenFilePathsOptions} options - Options to customize the flattening behavior
 * @returns {string[]} Array of flattened file paths as strings
 *
 * @example
 * ```typescript
 * import { flattenFilePaths } from "@ucdjs/shared";
 *
 * const files = [
 *   { name: "folder1", children: [{ name: "file1.txt" }] },
 *   { name: "file2.txt" }
 * ];
 * const paths = flattenFilePaths(files);
 * // Returns: ["folder1/file1.txt", "file2.txt"]
 * ```
 */
export function flattenFilePaths(entries: UnicodeTreeNode[], prefix: string = "", options: FlattenFilePathsOptions = {}): string[] {
  const {
    includeDirectories = false,
  } = options;

  const paths: string[] = [];

  if (!Array.isArray(entries)) {
    throw new TypeError("Expected 'entries' to be an array of UnicodeTreeNode");
  }

  for (const file of entries) {
    const fullPath = prefix
      ? `${prefix}${prependLeadingSlash(file.path ?? file.name)}`
      : (file.path ?? file.name);

    if (file.type === "directory") {
      if (includeDirectories) {
        paths.push(fullPath);
      }

      paths.push(...flattenFilePaths(file.children, fullPath, options));
    } else {
      paths.push(fullPath);
    }
  }

  return paths;
}
