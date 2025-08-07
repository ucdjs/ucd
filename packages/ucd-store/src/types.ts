import type { FileSystemBridge } from "@ucdjs/fs-bridge";

export interface UCDStoreOptions {
  /**
   * Base URL for the Unicode API
   *
   * @default "https://api.ucdjs.dev"
   */
  baseUrl?: string;

  /**
   * Optional filters to apply when fetching Unicode data.
   * These can be used to limit the data fetched from the API.
   */
  globalFilters?: string[];

  /**
   * File System Bridge to use for file operations.
   * You can either provide your own implementation or use one of the following:
   * - `@ucdjs/fs-bridge/bridges/node` for Node.js environments with full capabilities
   * - `@ucdjs/fs-bridge/bridges/http` for HTTP-based file systems (read-only)
   */
  fs: FileSystemBridge;

  /**
   * Base Path attached to the base URL, when accessing files.
   * This is used to resolve file paths when reading from the store.
   */
  basePath?: string;

  /**
   * List of Unicode versions to include in the store.
   * Only used when initializing a new store that supports mirroring.
   */
  versions?: string[];
}

export interface AnalyzeOptions {
  /**
   * Whether to check for orphaned files in the store.
   * Orphaned files are those that are not referenced by any Unicode version or data.
   * This can help identify files that are no longer needed.
   */
  checkOrphaned?: boolean;

  /**
   * Specific versions to analyze (if not provided, analyzes all)
   */
  versions?: string[];
}

export interface VersionAnalysis {
  /**
   * Analyzed Unicode version
   * This should be in the format "major.minor.patch" (e.g., "15.0.0")
   */
  version: string;

  /**
   * List of orphaned files (files that exist but shouldn't)
   */
  orphanedFiles: string[];

  /**
   * List of missing files (if any)
   */
  missingFiles: string[];

  /**
   * List of files that were found in the store for this version
   * This includes orphaned files
   */
  files: string[];

  /**
   * Total number of files expected for this version
   */
  expectedFileCount: number;

  /**
   * Number of files found for this version
   */
  fileCount: number;

  /**
   * Whether the version is complete
   * This means all expected files are present and no orphaned files exist.
   * If this is false, it indicates that some files are missing or there are orphaned files.
   */
  isComplete: boolean;
}

export interface StoreInitOptions {
  dryRun?: boolean;
  force?: boolean;
}

export interface MirrorOptions {
  /**
   * List of Unicode versions to include in the store.
   * Only used when initializing a new store that supports mirroring.
   */
  versions?: string[];

  /**
   * Whether to overwrite existing files in the store.
   * If true, existing files will be replaced with the new content.
   */
  force?: boolean;

  /**
   * Concurrency level for file operations.
   * This controls how many files can be processed in parallel.
   * Higher values may speed up the mirroring process but can also increase resource usage.
   */
  concurrency?: number;

  /**
   * Whether to perform a dry run without actually writing files.
   * This is useful for testing and debugging the mirroring process.
   */
  dryRun?: boolean;
}

export interface MirrorResult {
  /**
   * Analyzed Unicode version
   * This should be in the format "major.minor.patch" (e.g., "15.0.0")
   */
  version: string;

  /**
   * List of orphaned files (files that exist but shouldn't)
   */
  mirrored: string[];

  /**
   * List of files that were skipped during mirroring (if any)
   */
  skipped: string[];

  /**
   * List of files that failed to mirror (if any)
   */
  failed: string[];

}

export interface CleanOptions {
  /**
   * The versions to clean from the store, if not provided it will clean all versions.
   * This is useful for removing specific versions from the store.
   */
  versions?: string[];

  concurrency?: number;

  dryRun?: boolean;
}

export interface CleanResult {
  /**
   * Cleaned Unicode version
   * This should be in the format "major.minor.patch" (e.g., "15.0.0")
   */
  version: string;

  /**
   * List of files that were successfully deleted
   */
  deleted: string[];

  /**
   * List of files that were skipped during cleaning (e.g., already deleted)
   */
  skipped: string[];

  /**
   * List of files that failed to delete (if any)
   */
  failed: string[];
}
