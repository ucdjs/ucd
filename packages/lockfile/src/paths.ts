import { join } from "pathe";

/**
 * Gets the default lockfile path for a given base path.
 * The lockfile is always named `.ucd-store.lock` regardless of base path.
 *
 * @param {string} _notUsedWillBeRemoved - Base path (unused, kept for API compatibility)
 * @returns {string} The lockfile path (`.ucd-store.lock`)
 */
export function getLockfilePath(_notUsedWillBeRemoved: string): string {
  return ".ucd-store.lock";
}

/**
 * Gets the snapshot path for a given version.
 * Snapshots are stored inside version directories: {version}/snapshot.json
 *
 * Returns a relative path that will be resolved against the bridge's basePath.
 * This prevents path duplication when the bridge's basePath is already set.
 *
 * @param {string} version - The Unicode version
 * @returns {string} The snapshot path relative to the bridge's basePath
 */
export function getSnapshotPath(version: string): string {
  return join(version, "snapshot.json");
}
