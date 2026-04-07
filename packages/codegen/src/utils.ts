/**
 * Flattens a full Unicode version string by stripping trailing ".0" segments.
 * e.g. "17.0.0" → "17", "15.1.0" → "15.1"
 */
export function flattenVersion(version: string): string {
  const parts = version.split(".");
  while (parts.length > 1 && parts.at(-1) === "0") {
    parts.pop();
  }
  return parts.join(".");
}
