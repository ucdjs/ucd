/* eslint-disable node/prefer-global/process */
import { prependLeadingSlash, trimLeadingSlash } from "@luxass/utils";
import pathe from "pathe";
import { BridgePathTraversal, BridgeWindowsDriveDifference, BridgeWindowsPathMismatch, BridgeWindowsUNCShareMismatch } from "./errors";

export const MAX_DECODING_ITERATIONS = 10;
const WINDOWS_DRIVE_LETTER_REGEX = /^[A-Z]:/i;
const WINDOWS_DRIVE_REGEX = /^[A-Z]:[/\\]/i;
const WINDOWS_UNC_ROOT_REGEX = /^\\\\[^\\]+\\[^\\]+/;

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

  const baseUNCRootAny = getAnyUNCRoot(basePath);
  const inputUNCRootAny = getAnyUNCRoot(decodedPath);

  // early return, if both paths are UNC and differ, throw
  if (
    baseUNCRootAny
    && inputUNCRootAny
    && baseUNCRootAny.toLowerCase() !== inputUNCRootAny.toLowerCase()
  ) {
    throw new BridgePathTraversal(
      toUNCPosix(baseUNCRootAny),
      toUNCPosix(decodedPath),
    );
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
      || WINDOWS_UNC_ROOT_REGEX.test(decodedPath)
      || pathe.isAbsolute(toUnixFormat(decodedPath));

  if (isAbsoluteInput && isWithinBase(absoluteInputPath, normalizedBasePath)) {
    return pathe.normalize(absoluteInputPath);
  }

  // Windows-specific handling for absolute Windows forms
  const baseIsDriveAbs = WINDOWS_DRIVE_REGEX.test(normalizedBasePath);
  const baseIsUNCAbs = WINDOWS_UNC_ROOT_REGEX.test(normalizedBasePath);

  // If the input path is a Windows absolute path, we need to handle it specially.
  if (WINDOWS_DRIVE_REGEX.test(decodedPath)) {
    // Input = absolute drive path like "C:\foo"
    const inputDrive = getWindowsDriveLetter(decodedPath);
    if (isWindows && baseIsDriveAbs) {
      const baseDrive = getWindowsDriveLetter(normalizedBasePath);
      if (baseDrive && inputDrive && baseDrive !== inputDrive) {
        throw new BridgeWindowsDriveDifference(baseDrive, inputDrive);
      }
    }
    if (isWindows && baseIsUNCAbs) {
      // Mixing absolute drive with UNC base → reject on Windows
      throw new BridgeWindowsPathMismatch("UNC", "drive-letter absolute");
    }

    // Sandbox: strip drive root and append to base
    const withoutPrefix = decodedPath.replace(WINDOWS_DRIVE_REGEX, "");
    const relativePath = trimLeadingSlash(withoutPrefix).replace(/\\/g, "/");
    resolvedPath = pathe.resolve(normalizedBasePath, relativePath);
  } else if (WINDOWS_UNC_ROOT_REGEX.test(decodedPath)) {
    // Input = absolute UNC like "\\server\share\..."
    const inputUNCRoot = getWindowsUNCRoot(decodedPath);
    const baseUNCRoot = getWindowsUNCRoot(normalizedBasePath);

    if (isWindows && baseIsUNCAbs) {
      // On Windows, enforce same-share for double-absolute UNC
      const sameShare = baseUNCRoot && inputUNCRoot
        && baseUNCRoot.toLowerCase() === inputUNCRoot.toLowerCase();
      if (!sameShare) {
        throw new BridgeWindowsUNCShareMismatch(String(baseUNCRoot), String(inputUNCRoot));
      }
    }
    if (isWindows && baseIsDriveAbs) {
      // Mixing absolute UNC with drive base → reject on Windows
      throw new BridgeWindowsPathMismatch("drive-letter", "UNC absolute");
    }

    // Sandbox: strip the *matching* UNC root (if present) and append the tail to base
    const tail = inputUNCRoot
      ? trimLeadingSlash(decodedPath.slice(inputUNCRoot.length))
      : decodedPath.replace(/^\\+/, "");
    const relativePath = tail.replace(/\\/g, "/");
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
  const normalized = pathe.normalize(resolvedPath);

  if (isUNCish(basePath) || isUNCish(inputPath) || isUNCish(normalized)) {
    return toUNCPosix(normalized);
  }

  return normalized;
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

  // We apply leading slashes after we have verified that the inputs isn't empty.
  basePath = prependLeadingSlash(basePath);
  resolvedPath = prependLeadingSlash(resolvedPath);

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
  // virtual filesystem boundary model: absolute paths are relative to boundary root
  if (absoluteUnixPath === "/") {
    // root reference points to boundary root
    return basePath;
  }

  // strip leading slash and resolve relative to boundary root
  const pathWithoutLeadingSlash = absoluteUnixPath.replace(/^\/+/, "");
  return pathe.resolve(basePath, pathWithoutLeadingSlash);
}

/**
 * Handles relative Unix-style paths by resolving them against the base path.
 * @internal
 */
function handleRelativePath(relativeUnixPath: string, basePath: string): string {
  // current directory references point to base path
  if (relativeUnixPath === "." || relativeUnixPath === "./") {
    return basePath;
  }

  return pathe.resolve(basePath, relativeUnixPath);
}

/**
 * @internal
 */
export function getWindowsDriveLetter(str: string): string | null {
  const match = str.match(WINDOWS_DRIVE_LETTER_REGEX);

  if (match == null) return null;

  return match[0]?.[0]?.toUpperCase() || null;
}

/**
 * @internal
 */
export function getWindowsUNCRoot(str: string): string | null {
  const match = str.match(WINDOWS_UNC_ROOT_REGEX);

  if (match == null) return null;

  return match[0] || null;
}

function isUNCish(p: string): boolean {
  return WINDOWS_UNC_ROOT_REGEX.test(p) || /^\/\/[^/]+\/[^/]+/.test(p);
}

function toUNCPosix(p: string): string {
  // convert backslashes and ensure exactly two leading slashes.
  const body = p.replace(/\\/g, "/").replace(/^\/+/, "");
  return `//${body}`;
}

/**
 * @internal
 */
function getAnyUNCRoot(str: string): string | null {
  if (!str) return null;

  const win = str.match(/^\\\\([^\\]+)\\([^\\]+)/);

  if (win) return `//${win[1]}/${win[2]}`;

  const posix = str.match(/^\/\/([^/]+)\/([^/]+)/);
  if (posix) return `//${posix[1]}/${posix[2]}`;
  return null;
}
