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
   * If not provided, defaults to `{version}/snapshot.json`
   */
  snapshotPaths?: Record<string, string>;

  /**
   * Custom filters for the lockfile
   */
  filters?: {
    disableDefaultExclusions?: boolean;
    exclude?: string[];
    include?: string[];
  };

  /**
   * Custom createdAt timestamp for the lockfile
   * If not provided, defaults to current date
   */
  createdAt?: Date;

  /**
   * Custom updatedAt timestamp for the lockfile
   * If not provided, defaults to current date
   */
  updatedAt?: Date;

  /**
   * Custom timestamps per version entry
   */
  versionTimestamps?: Record<string, { createdAt?: Date; updatedAt?: Date }>;
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
    createdAt?: Date;
    updatedAt?: Date;
  },
): Lockfile["versions"][string] {
  const now = new Date();
  return {
    path: options?.snapshotPath ?? `${version}/snapshot.json`,
    fileCount: options?.fileCount ?? 0,
    totalSize: options?.totalSize ?? 0,
    createdAt: options?.createdAt ?? now,
    updatedAt: options?.updatedAt ?? now,
  };
}

/**
 * Creates an empty lockfile with the specified versions
 * All versions will have fileCount: 0 and totalSize: 0
 */
export function createEmptyLockfile(versions: string[]): Lockfile {
  const now = new Date();
  return {
    lockfileVersion: 1,
    createdAt: now,
    updatedAt: now,
    versions: Object.fromEntries(
      versions.map((version) => [version, createLockfileEntry(version, { createdAt: now, updatedAt: now })]),
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
  const now = new Date();
  const createdAt = options?.createdAt ?? now;
  const updatedAt = options?.updatedAt ?? now;

  const lockfile: Lockfile = {
    lockfileVersion: 1,
    createdAt,
    updatedAt,
    versions: Object.fromEntries(
      versions.map((version) => {
        const versionTimestamps = options?.versionTimestamps?.[version];
        return [
          version,
          createLockfileEntry(version, {
            fileCount: options?.fileCounts?.[version],
            totalSize: options?.totalSizes?.[version],
            snapshotPath: options?.snapshotPaths?.[version],
            createdAt: versionTimestamps?.createdAt ?? createdAt,
            updatedAt: versionTimestamps?.updatedAt ?? updatedAt,
          }),
        ];
      }),
    ),
  };

  // Only add filters if provided
  if (options?.filters) {
    lockfile.filters = {
      disableDefaultExclusions: options.filters.disableDefaultExclusions,
      exclude: options.filters.exclude,
      include: options.filters.include,
    };
  }

  return lockfile;
}
