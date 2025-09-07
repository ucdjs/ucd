import { prependLeadingSlash, trimTrailingSlash } from "@luxass/utils";
import pathe from "pathe";
import {
  WINDOWS_DRIVE_LETTER_EVERYWHERE_RE,
  WINDOWS_DRIVE_LETTER_START_RE,
  WINDOWS_DRIVE_RE,
  WINDOWS_UNC_ROOT_RE,
} from "./constants";
import { UNCPathNotSupportedError } from "./errors";

/**
 * Extracts the Windows drive letter from a given string, if present.
 * @param {string} str - The input string to check for a Windows drive letter.
 * @returns {string | null} The uppercase drive letter (e.g., "C") if found, otherwise null.
 */
export function getWindowsDriveLetter(str: string): string | null {
  const match = str.match(WINDOWS_DRIVE_LETTER_START_RE);

  if (match == null) return null;

  return match[0]?.[0]?.toUpperCase() || null;
}

/**
 * Checks if the given path is a Windows drive path (e.g., "C:", "D:\").
 * @param {string} path - The path to check.
 * @returns {boolean} True if the path is a Windows drive path, false otherwise.
 */
export function isWindowsDrivePath(path: string): boolean {
  return WINDOWS_DRIVE_RE.test(path);
}

/**
 * Removes the Windows drive letter from a path string.
 * @param {string} path - The path to strip the drive letter from.
 * @returns {string} The path without the Windows drive letter.
 * @throws {TypeError} If the provided path is not a string.
 */
export function stripDriveLetter(path: string): string {
  if (typeof path !== "string") {
    throw new TypeError("Path must be a string");
  }

  // Reject UNC paths early
  assertNotUNCPath(path);

  // remove the Windows drive letter (e.g., "C:") from the start of the path
  return path.replace(WINDOWS_DRIVE_RE, "");
}

/**
 * Checks if the given path is a UNC (Universal Naming Convention) path.
 * @param {string} path - The path to check.
 * @returns {boolean} True if the path is a UNC path, false otherwise.
 */
export function isUNCPath(path: string): boolean {
  return WINDOWS_UNC_ROOT_RE.test(path) || path.startsWith("//");
}

/**
 * Asserts that the given path is not a UNC path. Throws UNCPathNotSupportedError if it is.
 * @param {string} path - The path to check.
 * @throws {UNCPathNotSupportedError} If the path is a UNC path.
 */
export function assertNotUNCPath(path: string): void {
  if (isUNCPath(path)) {
    throw new UNCPathNotSupportedError(path);
  }
}

/**
 * Converts a path to Unix format by normalizing separators, stripping Windows drive letters, and ensuring a leading slash.
 * @param {string} inputPath - The input path to convert.
 * @returns {string} The path in Unix format.
 */
export function toUnixFormat(inputPath: string): string {
  if (typeof inputPath !== "string") {
    throw new TypeError("Input path must be a string");
  }

  if (inputPath.trim() === "") {
    return "/";
  }

  // Reject UNC paths early
  assertNotUNCPath(inputPath);

  let normalized = pathe.normalize(inputPath.trim());

  // strip driver letters from the normalized string
  normalized = normalized.replace(WINDOWS_DRIVE_LETTER_EVERYWHERE_RE, "");
  normalized = prependLeadingSlash(normalized);

  return trimTrailingSlash(pathe.normalize(normalized));
}

