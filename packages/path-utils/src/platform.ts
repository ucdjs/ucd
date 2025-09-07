import { prependLeadingSlash, trimTrailingSlash } from "@luxass/utils";
import pathe from "pathe";
import {
  WINDOWS_DRIVE_LETTER_EVERYWHERE_RE,
  WINDOWS_DRIVE_LETTER_START_RE,
  WINDOWS_DRIVE_RE,
  WINDOWS_UNC_ROOT_RE,
} from "./constants";

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

  // remove the Windows drive letter (e.g., "C:") from the start of the path
  return path.replace(WINDOWS_DRIVE_RE, "");
}

/**
 * Checks if the given path is a UNC (Universal Naming Convention) path.
 * @param {string} path - The path to check.
 * @returns {boolean} True if the path is a UNC path, false otherwise.
 */
export function isUNCPath(path: string): boolean {
  return WINDOWS_UNC_ROOT_RE.test(path) || (path.startsWith("//") && getAnyUNCRoot(path) !== null);
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

  let normalized = pathe.normalize(inputPath.trim());

  // pathe already converts to forward slashes, so we mainly need to handle:
  // 1. UNC paths (already become //server/share/path)
  // 2. Drive letters that pathe might preserve

  // check if this is a UNC path (starts with //)
  if (isUNCPath(inputPath)) {
    return trimTrailingSlash(normalized);
  }

  // strip driver letters from the normalized string
  normalized = normalized.replace(WINDOWS_DRIVE_LETTER_EVERYWHERE_RE, "");
  normalized = prependLeadingSlash(normalized);

  return trimTrailingSlash(pathe.normalize(normalized));
}

/**
 * Extracts the UNC (Universal Naming Convention) root from a given string, if present.
 * @param {string} str - The input string to check for a UNC root.
 * @returns {string | null} The UNC root in the format "//server/share" if found, otherwise null.
 */
export function getAnyUNCRoot(str: string): string | null {
  if (!str || str.length < 5) return null;
  if (!str.startsWith("\\\\") && !str.startsWith("//")) return null;

  const match = str.match(/^(\\\\|\/\/)([^\\/]+)[\\/]([^\\/]+)/);
  return match ? `//${match[2]}/${match[3]}` : null;
}

/**
 * Converts Windows UNC paths to Unix-style (POSIX) UNC paths
 * @param {string} inputPath - The UNC path to convert
 * @returns {string | null} Unix-style UNC path or null if not a valid UNC path
 */
export function toUNCPosix(inputPath: string): string | null {
  if (typeof inputPath !== "string") {
    throw new TypeError("Input path must be a string");
  }

  if (!inputPath || inputPath.trim() === "") {
    return null;
  }

  const trimmed = inputPath.trim();

  // check if it's a UNC path (starts with \\ or //)
  if (!trimmed.startsWith("\\\\") && !trimmed.startsWith("//")) {
    return null;
  }

  const normalized = pathe.normalize(trimmed);

  // pathe converts \\server\share to //server/share
  // but we need to ensure it starts with exactly //
  if (!normalized.startsWith("//")) {
    return null;
  }

  // validate that we have at least server and share
  const parts = normalized.split("/").filter((part) => part !== "");
  if (parts.length < 2) {
    return null;
  }

  return trimTrailingSlash(normalized);
}
