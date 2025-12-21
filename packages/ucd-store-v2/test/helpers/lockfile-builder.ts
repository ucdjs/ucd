import type { Lockfile } from "@ucdjs/schemas";

export interface CreateLockfileOptions {
  /**
   * Custom file counts per version
   */
  fileCounts?: Record<string, number>;

  /**
   * Custom total sizes per version (in bytes)
   */
  totalSizes?: Record<string, number>;

  /**
   * Custom snapshot paths per version
   * If not provided, defaults to `v{version}/snapshot.json`
   */
  snapshotPaths?: Record<string, string>;
}

/**
 * Creates a lockfile entry for a single version
 */
export function createLockfileEntry(
  version: string,
  options?: {
    fileCount?: number;
    totalSize?: number;
    snapshotPath?: string;
  },
): Lockfile["versions"][string] {
  return {
    path: options?.snapshotPath ?? `v${version}/snapshot.json`,
    fileCount: options?.fileCount ?? 0,
    totalSize: options?.totalSize ?? 0,
  };
}

/**
 * Creates an empty lockfile with the specified versions
 * All versions will have fileCount: 0 and totalSize: 0
 */
export function createEmptyLockfile(versions: string[]): Lockfile {
  return {
    lockfileVersion: 1,
    versions: Object.fromEntries(
      versions.map((version) => [version, createLockfileEntry(version)]),
    ),
  };
}

/**
 * Creates a lockfile with the specified versions and optional customizations
 */
export function createLockfile(
  versions: string[],
  options?: CreateLockfileOptions,
): Lockfile {
  return {
    lockfileVersion: 1,
    versions: Object.fromEntries(
      versions.map((version) => [
        version,
        createLockfileEntry(version, {
          fileCount: options?.fileCounts?.[version],
          totalSize: options?.totalSizes?.[version],
          snapshotPath: options?.snapshotPaths?.[version],
        }),
      ]),
    ),
  };
}
