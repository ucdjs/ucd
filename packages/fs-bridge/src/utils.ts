import pathe from "pathe";
import { BridgePathTraversal } from "./errors";

const DANGEROUS_CONTROL_CHARACTER_REGEX = /[\0\n\r]/;

/**
 * Safely resolves a user-provided path relative to a base directory while preventing path traversal attacks.
 *
 * This function performs multiple security checks:
 * - Detects dangerous control characters (null bytes, newlines, carriage returns)
 * - URL-decodes the input path to catch encoded traversal attempts
 * - Normalizes and resolves paths to prevent directory traversal
 * - Validates that the final resolved path stays within the base directory
 *
 * @param {string} basePath - The base directory that should contain the resolved path
 * @param {string} inputPath - The user-provided path to resolve (can be relative or absolute)
 * @returns {string} The safely resolved absolute path within the base directory
 * @throws {Error} When path traversal is detected or the resolved path would escape the base directory
 *
 * @remarks
 * - Absolute input paths are treated as relative to the base directory
 * - URL-encoded characters are decoded once to detect encoded traversal attempts
 * - The function handles both Unix and Windows path separators correctly
 */
export function resolveSafePath(basePath: string, inputPath: string): string {
  // fast check for dangerous control characters
  if (DANGEROUS_CONTROL_CHARACTER_REGEX.test(inputPath)) {
    throw new Error(`Path contains dangerous control characters: ${inputPath}`);
  }

  // decode URL-encoded characters once to detect encoded traversal attempts
  let decodedPath = inputPath;
  if (inputPath.includes("%")) {
    try {
      decodedPath = decodeURIComponent(inputPath);
    } catch {
      throw new Error(`Invalid URL encoding in path: ${inputPath}`);
    }
  }

  const resolvedBasePath = pathe.resolve(basePath);

  // handle absolute paths
  let cleanPath: string;
  if (pathe.isAbsolute(decodedPath)) {
    // if the absolute path is already within the base path, use the relative portion
    const resolvedInputPath = pathe.resolve(decodedPath);
    if (resolvedInputPath.startsWith(resolvedBasePath + pathe.sep) || resolvedInputPath === resolvedBasePath) {
      cleanPath = pathe.relative(resolvedBasePath, resolvedInputPath);
    } else {
      // treat absolute paths as relative to base (remove leading slash)
      cleanPath = pathe.normalize(decodedPath.slice(1));
    }
  } else {
    cleanPath = pathe.normalize(decodedPath);
  }

  const resolvedPath = pathe.resolve(resolvedBasePath, cleanPath);

  // check if resolved path is within the base directory
  if (!isWithinBase(resolvedPath, resolvedBasePath)) {
    throw new BridgePathTraversal(inputPath);
  }

  return resolvedPath;
}

/**
 * Checks if a resolved path is within the specified base directory.
 * This function is used for security validation to prevent path traversal attacks.
 *
 * @param {string} resolvedPath - The fully resolved absolute path to validate
 * @param {string} basePath - The base directory path that should contain the resolved path
 * @returns {boolean} `true` if the resolved path is within the base directory, `false` otherwise
 *
 * @remarks
 * - For root base path ("/"), any absolute path is considered valid
 * - For non-root base paths, the resolved path must either equal the base path
 *   or start with the base path followed by a path separator
 */
export function isWithinBase(resolvedPath: string, basePath: string): boolean {
  // handle root base path case
  if (basePath === "/") {
    return resolvedPath === "/" || resolvedPath.startsWith("/");
  }

  // for non-root base paths, check if resolved path starts with base + separator or equals base
  return resolvedPath.startsWith(basePath + pathe.sep) || resolvedPath === basePath;
}
