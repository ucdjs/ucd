import { join } from "pathe";

/**
 * Gets the default lockfile path for a given base path.
 * The lockfile is always named `.ucd-store.lock` regardless of base path.
 *
 * @param {string} _basePath - Base path (unused, kept for API compatibility)
 * @returns {string} The lockfile path (`.ucd-store.lock`)
 */
export function getLockfilePath(_basePath: string): string {
  return ".ucd-store.lock";
}

/**
 * Gets the snapshot path for a given version.
 * Snapshots are stored inside version directories: {version}/snapshot.json
 *
 * @param {string} basePath - Base path of the store
 * @param {string} version - The Unicode version
 * @returns {string} The snapshot path
 */
export function getSnapshotPath(basePath: string, version: string): string {
  return join(basePath, version, "snapshot.json");
}

