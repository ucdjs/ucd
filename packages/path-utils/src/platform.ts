import pathe from "pathe";

const WINDOWS_DRIVE_LETTER_REGEX = /^[A-Z]:/i;
const WINDOWS_UNC_ROOT_REGEX = /^\\\\(?![.?]\\)[^\\]+\\[^\\]+/;

/**
 * Extracts the Windows drive letter from a given string, if present.
 * @param {string} str - The input string to check for a Windows drive letter.
 * @returns {string | null} The uppercase drive letter (e.g., "C") if found, otherwise null.
 */
export function getWindowsDriveLetter(str: string): string | null {
  const match = str.match(WINDOWS_DRIVE_LETTER_REGEX);

  if (match == null) return null;

  return match[0]?.[0]?.toUpperCase() || null;
}

/**
 * Checks if the given path is a UNC (Universal Naming Convention) path.
 * @param {string} path - The path to check.
 * @returns {boolean} True if the path is a UNC path, false otherwise.
 */
export function isUNCPath(path: string): boolean {
  return pathe.isAbsolute(path) && WINDOWS_UNC_ROOT_REGEX.test(path);
}
