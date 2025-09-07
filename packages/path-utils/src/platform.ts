import { prependLeadingSlash } from "@luxass/utils";
import pathe from "pathe";
import {
  WINDOWS_DRIVE_LETTER_EVERYWHERE_RE,
  WINDOWS_DRIVE_LETTER_START_RE,
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
 * Checks if the given path is a UNC (Universal Naming Convention) path.
 * @param {string} path - The path to check.
 * @returns {boolean} True if the path is a UNC path, false otherwise.
 */
export function isUNCPath(path: string): boolean {
  return pathe.isAbsolute(path) && WINDOWS_UNC_ROOT_RE.test(path);
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
    return normalized;
  }

  // strip driver letters from the normalized string
  normalized = normalized.replace(WINDOWS_DRIVE_LETTER_EVERYWHERE_RE, "");
  normalized = prependLeadingSlash(normalized);

  return pathe.normalize(normalized);
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
