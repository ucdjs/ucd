import pathe from "pathe";
import { BridgePathTraversal } from "./errors";

const MAX_DECODING_ITERATIONS = 10;

/**
 * @internal
 */
export function decodePathSafely(encodedPath: string): string {
  if (typeof encodedPath !== "string") {
    throw new TypeError("Encoded path must be a string");
  }

  let decodedPath = encodedPath;
  let previousPath: string;
  let iterations = 0;

  do {
    previousPath = decodedPath;

    try {
      // try to url decode
      decodedPath = decodeURIComponent(decodedPath);
    } catch {
      // we continue even though decoding failed
    }

    // handle common manual encodings
    decodedPath = decodedPath
      .replace(/%2e/gi, ".") // encoded dots
      .replace(/%2f/gi, "/") // encoded forward slashes
      .replace(/%5c/gi, "\\"); // encoded backslashes

    iterations++;
  } while (decodedPath !== previousPath && iterations < MAX_DECODING_ITERATIONS);

  if (iterations >= MAX_DECODING_ITERATIONS) {
    throw new Error("Maximum decoding iterations exceeded - possible malicious input");
  }

  return decodedPath;
}

export function resolveSafePath(basePath: string, inputPath: string): string {
  if (!basePath || !inputPath) {
    throw new Error("Base path and user path are required");
  }

  if (typeof basePath !== "string" || typeof inputPath !== "string") {
    throw new TypeError("Base path and user path must be strings");
  }

  // normalize the base path to absolute form
  const normalizedBasePath = pathe.resolve(basePath);

  // decode the input path until there are no more encoded segments
  let decodedPath: string;
  try {
    decodedPath = decodePathSafely(inputPath);
  } catch (err) {
    throw new Error(`Failed to decode path safely: ${err instanceof Error ? err.message : "Unknown error"}`);
  }

  // TODO:
  // should we treat absolute paths as relative?

  if (pathe.isAbsolute(decodedPath)) {
    decodedPath = pathe.relative(normalizedBasePath, decodedPath);
  }

  const resolvedPath = pathe.resolve(normalizedBasePath, decodedPath);

  if (!isWithinBase(resolvedPath, normalizedBasePath)) {
    throw new BridgePathTraversal("Path traversal detected");
  }

  return resolvedPath;
}

/**
 * Checks if a resolved path is within the bounds of a base directory path.
 *
 * This function performs a normalized string comparison to determine if the resolved path
 * is equal to or a subdirectory of the base path. It handles path normalization and
 * ensures proper separator handling to prevent partial path matches.
 *
 * @param {string} resolvedPath - The resolved absolute path to check
 * @param {string} basePath - The base directory path to check against
 * @returns {boolean} `true` if the resolved path is within the base path bounds, `false` otherwise
 *
 * @example
 * ```typescript
 * isWithinBase('/home/user/docs/file.txt', '/home/user') // true
 * isWithinBase('/home/user2/file.txt', '/home/user') // false
 * isWithinBase('/home/user', '/home/user') // true (same path)
 * ```
 *
 * @remarks
 * Returns `false` if either parameter is not a string.
 * Normalizes both paths before comparison.
 * Uses path separators to prevent partial matches (e.g., '/root' vs '/root2').
 */
export function isWithinBase(resolvedPath: string, basePath: string): boolean {
  if (typeof resolvedPath !== "string" || typeof basePath !== "string") {
    return false;
  }

  if (resolvedPath.trim() === "" || basePath.trim() === "") {
    return false;
  }

  const normalizedResolved = pathe.normalize(resolvedPath);
  const normalizedBase = pathe.normalize(basePath);

  // TODO: handle windows case insensitivity

  const resolved = normalizedResolved;
  const base = normalizedBase;

  // check if the resolved path starts with the base path. To prevent partial matches
  // like /root vs /root2, we append a separator unless the base path already ends
  // with one (such as the root directory "/").
  const baseWithSeparator = base.endsWith(pathe.sep) ? base : base + pathe.sep;
  return resolved === base || resolved.startsWith(baseWithSeparator);
}
