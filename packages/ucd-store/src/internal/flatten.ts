import type { UnicodeVersionFile } from "@ucdjs/fetch";

/**
 * Recursively flattens a hierarchical file structure into an array of file paths.
 *
 * @param {UnicodeVersionFile[]} entries - Array of Unicode version files that may contain nested children
 * @param {string} [prefix] - Optional path prefix to prepend to each file path (default: "")
 * @returns {string[]} Array of flattened file paths as strings
 *
 * @example
 * ```typescript
 * const files = [
 *   { name: "folder1", children: [{ name: "file1.txt" }] },
 *   { name: "file2.txt" }
 * ];
 * const paths = flattenFilePaths(files);
 * // Returns: ["folder1/file1.txt", "file2.txt"]
 * ```
 */
export function flattenFilePaths(entries: UnicodeVersionFile[], prefix: string = ""): string[] {
  const paths: string[] = [];

  for (const file of entries) {
    const fullPath = prefix ? `${prefix}/${file.name}` : file.name;

    if (file.children) {
      paths.push(...flattenFilePaths(file.children, fullPath));
    } else {
      paths.push(fullPath);
    }
  }

  return paths;
}
