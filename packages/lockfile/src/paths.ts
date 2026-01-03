import { join } from "pathe";

/**
 * Gets the lockfile filename.
 * The lockfile is always named `.ucd-store.lock` and stored at the store root.
 *
 * @returns {string} The lockfile filename
 */
export function getLockfilePath(): string {
  return ".ucd-store.lock";
}

/**
 * Gets the snapshot path for a given version (relative to store root).
 * Snapshots are stored inside version directories: {version}/snapshot.json
 *
 * @param {string} version - The Unicode version
 * @returns {string} The snapshot path relative to store root
 */
export function getSnapshotPath(version: string): string {
  return join(version, "snapshot.json");
}
