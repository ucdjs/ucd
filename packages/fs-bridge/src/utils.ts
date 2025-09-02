/* eslint-disable node/prefer-global/process */
import pathe from "pathe";
import { BridgePathTraversal } from "./errors";

const MAX_DECODING_ITERATIONS = 10;
const WINDOWS_DRIVE_LETTER_REGEX = /^[A-Z]:/i;
const WINDOWS_DRIVE_REGEX = /^[A-Z]:[/\\]/i;
const WINDOWS_UNC_REGEX = /^\\\\[^\\]+\\[^\\]+/;

// we can't use node's process directly in the browser
const isWindows = "process" in globalThis
  && typeof globalThis.process === "object"
  && "platform" in globalThis.process
  && typeof globalThis.process.platform === "string"
  && globalThis.process.platform === "win32";

// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTER_REGEX = /[\u0000-\u001F\u007F-\u009F]/u;

/**
 * Safely resolves a user-provided path relative to a base directory with path traversal protection.
 *
 * This function takes a base directory path and a user-provided input path, then safely resolves
 * them together while preventing path traversal attacks. It performs URL decoding, path normalization,
 * and validates that the final resolved path remains within the bounds of the base directory.
 *
 * @param {string} basePath - The base directory path that serves as the root for resolution
 * @param {string} inputPath - The user-provided path to resolve (can be relative or absolute)
 * @returns {string} The safely resolved absolute path within the base directory
 *
 * @throws {Error} When base path or input path are missing or not strings
 * @throws {TypeError} When parameters are not of string type
 * @throws {Error} When path decoding fails due to malicious input
 * @throws {BridgePathTraversal} When the resolved path would escape the base directory (path traversal detected)
 *
 * @example
 * ```typescript
 * // Basic usage with relative path
 * resolveSafePath('/home/user/docs', 'file.txt')
 * // Returns: '/home/user/docs/file.txt'
 *
 * // Handles URL-encoded paths
 * resolveSafePath('/home/user/docs', 'folder%2Ffile.txt')
 * // Returns: '/home/user/docs/folder/file.txt'
 *
 * // Prevents path traversal attacks
 * resolveSafePath('/home/user/docs', '../../../etc/passwd')
 * // Throws: BridgePathTraversal
 * ```
 *
 * @remarks
 * - Automatically normalizes the base path to absolute form
 * - Performs iterative URL decoding to handle multiple encoding layers
 * - Treats absolute input paths as relative to the base path
 * - Uses path traversal detection to ensure security
 *
 * @security
 * This function is designed to prevent directory traversal attacks by validating
 * that the final path remains within base directory bounds.
 */
export function resolveSafePath(basePath: string, inputPath: string): string {
  if (!basePath) {
    throw new Error("Base path is required");
  }

  if (typeof basePath !== "string") {
    throw new TypeError("Base path must be a string");
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

  if (decodedPath.includes("\0") || CONTROL_CHARACTER_REGEX.test(decodedPath)) {
    throw new Error("Invalid path format or contains illegal characters");
  }

  let resolvedPath: string;

  const absoluteInputPath = pathe.resolve(decodedPath);

  // If the input path is "within" the base path, we can just return as-is.
  // This is to ensure that something like "C:\Users\John\Documents\Projects\file.txt"
  // is treated as a valid path without unnecessary modifications.

  // Examples:
  // Windows
  // Base Path: C:\Users\John
  // Input Path: C:\Users\John\Documents\Projects\file.txt
  // Output Path: C:\Users\John\Documents\Projects\file.txt
  // -----
  // Unix
  // Base Path: /home/user
  // Input Path: /home/user/docs/file.txt
  // Output Path: /home/user/docs/file.txt

  const isAbsoluteInput
    = WINDOWS_DRIVE_REGEX.test(decodedPath)
      || WINDOWS_UNC_REGEX.test(decodedPath)
      || pathe.isAbsolute(toUnixFormat(decodedPath));
  if (isAbsoluteInput && isWithinBase(absoluteInputPath, normalizedBasePath)) {
    return pathe.normalize(absoluteInputPath);
  }

  // If the input path is a Windows absolute path, we need to handle it specially.
  if (WINDOWS_DRIVE_REGEX.test(decodedPath) || WINDOWS_UNC_REGEX.test(decodedPath)) {
    // Handle Windows absolute paths that are outside the base
    // Outside boundary:
    // - Drive: strip "C:\" prefix
    // - UNC: strip leading "\\" to treat as relative "server\share\..."
    const withoutPrefix = WINDOWS_DRIVE_REGEX.test(decodedPath)
      ? decodedPath.replace(WINDOWS_DRIVE_REGEX, "")
      : decodedPath.replace(/^\\{2,}/, "");
    const relativePath = withoutPrefix.replace(/\\/g, "/");
    resolvedPath = pathe.resolve(normalizedBasePath, relativePath);
  } else {
    const unixPath = toUnixFormat(decodedPath);

    if (pathe.isAbsolute(unixPath)) {
      resolvedPath = handleAbsolutePath(unixPath, normalizedBasePath);
    } else {
      resolvedPath = handleRelativePath(unixPath, normalizedBasePath);
    }
  }

  // final boundary validation
  if (!isWithinBase(resolvedPath, normalizedBasePath)) {
    throw new BridgePathTraversal(normalizedBasePath, resolvedPath);
  }

  // normalize to platform-native format for final output
  return pathe.normalize(resolvedPath);
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

  const normalizedResolved = isWindows ? pathe.win32.normalize(resolvedPath) : pathe.normalize(resolvedPath);
  const normalizedBase = isWindows ? pathe.win32.normalize(basePath) : pathe.normalize(basePath);

  const resolved = isWindows ? normalizedResolved.toLowerCase() : normalizedResolved;
  const base = isWindows ? normalizedBase.toLowerCase() : normalizedBase;

  // check if the resolved path starts with the base path. To prevent partial matches
  // like /root vs /root2, we append a separator unless the base path already ends
  // with one (such as the root directory "/").
  const baseWithSeparator = base.endsWith(pathe.sep) ? base : base + pathe.sep;
  return resolved === base || resolved.startsWith(baseWithSeparator);
}

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

/**
 * @internal
 */
export function toUnixFormat(inputPath: string): string {
  if (typeof inputPath !== "string") {
    return String(inputPath);
  }

  // Convert Windows-style paths to Unix-style
  let normalized = inputPath.replace(/\\/g, "/");

  // Handle Windows drive letters (C:\path -> /C:/path)
  if (WINDOWS_DRIVE_LETTER_REGEX.test(normalized)) {
    normalized = `/${normalized}`;
  }

  // Handle paths starting with backslash (\path -> /path)
  if (inputPath.startsWith("\\") && !inputPath.startsWith("\\\\")) {
    normalized = normalized.replace(/^\/+/, "/");
  }

  return normalized;
}

/**
 * Handles absolute Unix-style paths by treating them as relative to the base path boundary.
 * @internal
 */
function handleAbsolutePath(absoluteUnixPath: string, basePath: string): string {
  // Virtual filesystem boundary model: absolute paths are relative to boundary root
  if (absoluteUnixPath === "/") {
    // Root reference points to boundary root
    return basePath;
  }

  // Strip leading slash and resolve relative to boundary root
  const pathWithoutLeadingSlash = absoluteUnixPath.replace(/^\/+/, "");
  return pathe.resolve(basePath, pathWithoutLeadingSlash);
}

/**
 * Handles relative Unix-style paths by resolving them against the base path.
 * @internal
 */
function handleRelativePath(relativeUnixPath: string, basePath: string): string {
  // Current directory references point to base path
  if (relativeUnixPath === "." || relativeUnixPath === "./") {
    return basePath;
  }

  return pathe.resolve(basePath, relativeUnixPath);
}
