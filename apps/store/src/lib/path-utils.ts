import { hasUCDFolderPath } from "@unicode-utils/core";

/**
 * Transforms a file path for fetching from Unicode.org
 * Adds /ucd/ prefix for modern versions (>=6.0)
 *
 * @example
 * transformPathForUnicodeOrg("17.0.0", "Blocks.txt")
 * // Returns: "17.0.0/ucd/Blocks.txt"
 *
 * transformPathForUnicodeOrg("4.0.1", "Blocks.txt")
 * // Returns: "4.0.1/Blocks.txt"
 */
export function transformPathForUnicodeOrg(version: string, filepath: string): string {
  const cleanPath = filepath.replace(/^\/+/, "");
  const needsUCD = hasUCDFolderPath(version);

  if (needsUCD) {
    return `${version}/ucd/${cleanPath}`;
  }

  return `${version}/${cleanPath}`;
}

/**
 * Strips /ucd/ prefix from paths in responses
 * Used for directory listings and snapshot generation
 * Handles multiple consecutive /ucd/ occurrences
 *
 * @example
 * ```ts
 * stripUCDPrefix("/17.0.0/ucd/Blocks.txt")
 * // Returns: "/17.0.0/Blocks.txt"
 *
 * stripUCDPrefix("/17.0.0/ucd/emoji/emoji-data.txt")
 * // Returns: "/17.0.0/emoji/emoji-data.txt"
 *
 * stripUCDPrefix("/17.0.0/Blocks.txt")
 * // Returns: "/17.0.0/Blocks.txt" (unchanged)
 *
 * stripUCDPrefix("/ucd/ucd/test.txt")
 * // Returns: "/test.txt"
 *
 * stripUCDPrefix("/ucd/ucd/ucd/test.txt")
 * // Returns: "/test.txt"
 * ```
 */
export function stripUCDPrefix(path: string): string {
  return path.replace(/(?:\/ucd)+\//g, "/");
}

/**
 * Extracts just the filename from a manifest path
 *
 * @example
 * extractFilename("/17.0.0/ucd/Blocks.txt", "17.0.0")
 * // Returns: "Blocks.txt"
 *
 * extractFilename("/17.0.0/ucd/emoji/emoji-data.txt", "17.0.0")
 * // Returns: "emoji/emoji-data.txt"
 */
export function extractFilename(manifestPath: string, version: string): string {
  // Remove leading slashes
  let path = manifestPath.replace(/^\/+/, "");

  // Remove version prefix
  if (path.startsWith(`${version}/`)) {
    path = path.slice(version.length + 1);
  }

  // Remove /ucd/ prefix
  if (path.startsWith("ucd/")) {
    path = path.slice(4);
  }

  return path;
}
