export * from "./cache";
export * from "./constants";
export * from "./content-validation";
export * from "./environment";
export * from "./errors";
export * from "./handlers";
export * from "./hostnames";
export * from "./strict";
export * from "./tasks";

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
