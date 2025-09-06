import { prependLeadingSlash } from "@luxass/utils";
import pathe from "pathe";
import { isCaseSensitive } from "./utils";

/**
 * Checks if the resolved path is within the specified base path, considering case sensitivity.
 * This function normalizes paths, applies leading slashes, and ensures the resolved path starts with the base path
 * followed by a separator to prevent partial matches.
 * @param {string} resolvedPath - The path to check, must be a non-empty string.
 * @param {string} basePath - The base path to check against, must be a non-empty string.
 * @returns {boolean} True if the resolved path is within the base path, false otherwise.
 */
export function isWithinBase(resolvedPath: string, basePath: string): boolean {
  if (typeof resolvedPath !== "string" || typeof basePath !== "string") {
    return false;
  }

  if (resolvedPath.trim() === "" || basePath.trim() === "") {
    return false;
  }

  // we apply leading slashes after we have verified that the inputs isn't empty.
  basePath = prependLeadingSlash(basePath.trim());
  resolvedPath = prependLeadingSlash(resolvedPath.trim());

  const normalizedResolved = pathe.normalize(resolvedPath);
  const normalizedBase = pathe.normalize(basePath);

  const resolved = isCaseSensitive ? normalizedResolved : normalizedResolved.toLowerCase();
  const base = isCaseSensitive ? normalizedBase : normalizedBase.toLowerCase();

  // check if the resolved path starts with the base path. To prevent partial matches
  // like /root vs /root2, we append a separator unless the base path already ends
  // with one (such as the root directory "/").
  const baseWithSeparator = base.endsWith(pathe.sep) ? base : base + pathe.sep;
  return resolved === base || resolved.startsWith(baseWithSeparator);
}
