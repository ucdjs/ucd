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
   * Total number of files expected for this version
   */
  totalFileCount: number;

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

export interface MirrorOptions {
  versions?: string[];
  concurrency?: number;
  dryRun?: boolean;
}
