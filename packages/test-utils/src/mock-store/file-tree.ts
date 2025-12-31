import type { UnicodeTreeNode } from "@ucdjs/schemas";

/**
 * A file tree node with optional content for mocking file downloads.
 * The `_content` property is used by the files handler to return content.
 */
export type FileTreeNodeWithContent = UnicodeTreeNode & { _content?: string };

/**
 * Input format for creating file trees.
 * - String values represent file content
 * - Nested objects represent directories with their contents
 *
 * @example
 * ```ts
 * // Simple flat files
 * {
 *   "UnicodeData.txt": "file content",
 *   "Blocks.txt": "blocks content"
 * }
 *
 * // Nested directories
 * {
 *   "UnicodeData.txt": "content",
 *   "auxiliary": {
 *     "GraphemeBreakProperty.txt": "content",
 *     "WordBreakProperty.txt": "content"
 *   }
 * }
 *
 * // Deeply nested
 * {
 *   "extracted": {
 *     "DerivedBidiClass.txt": "content",
 *     "nested": {
 *       "DeepFile.txt": "content"
 *     }
 *   }
 * }
 * ```
 */
export interface FileTreeInput {
  [name: string]: string | FileTreeInput;
}

/**
 * Creates a file tree structure from a simplified input format.
 *
 * This utility converts a nested object structure into the UnicodeTreeNode format
 * used by mockStoreApi. String values become files with that content, nested objects
 * become directories.
 *
 * @param input - Object mapping names to content (files) or nested objects (directories)
 * @param parentPath - Internal parameter for building nested paths (don't pass this)
 * @returns Array of FileTreeNodeWithContent for use with mockStoreApi
 *
 * @example
 * ```ts
 * // Flat files
 * createFileTree({
 *   "UnicodeData.txt": "0041;LATIN CAPITAL LETTER A",
 *   "Blocks.txt": "0000..007F; Basic Latin"
 * })
 *
 * // With directories
 * createFileTree({
 *   "UnicodeData.txt": "content",
 *   "auxiliary": {
 *     "GraphemeBreakProperty.txt": "content"
 *   }
 * })
 *
 * // Use with mockStoreApi
 * mockStoreApi({
 *   versions: ["16.0.0"],
 *   files: {
 *     "*": createFileTree({
 *       "UnicodeData.txt": "content",
 *       "Blocks.txt": "content"
 *     })
 *   }
 * })
 * ```
 */
export function createFileTree(
  input: FileTreeInput,
  parentPath = "",
): FileTreeNodeWithContent[] {
  const result: FileTreeNodeWithContent[] = [];

  for (const [name, value] of Object.entries(input)) {
    const path = parentPath ? `${parentPath}/${name}` : name;

    if (typeof value === "string") {
      // It's a file with content
      result.push({
        type: "file",
        name,
        path,
        _content: value,
      });
    } else {
      // It's a directory - recursively process children
      result.push({
        type: "directory",
        name,
        path,
        children: createFileTree(value, path),
      });
    }
  }

  return result;
}
