import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";

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
   * - `@ucdjs/utils/fs-bridge/node` for Node.js environments with full capabilities
   * - `@ucdjs/utils/fs-bridge/http` for HTTP-based file systems (read-only)
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
   * Whether to check for orphaned files
   */
  checkOrphaned?: boolean;
}

export interface RepairOptions {
  /**
   * Whether to perform a dry run
   */
  dryRun?: boolean;
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

export interface AnalyzeResult {
  /**
   * Total number of files across all versions
   */
  totalFiles: number;

  /**
   * Detailed analysis for each version
   */
  versions: VersionAnalysis[];

  /**
   * Overall health status of the store
   */
  storeHealth: "healthy" | "needs_cleanup" | "corrupted";
}

export interface AnalyzeOptions {
  /**
   * Specific versions to analyze (if not provided, analyzes all)
   */
  versions?: string[];

  /**
   * Whether to check for orphaned files
   */
  checkOrphaned?: boolean;
}

export interface FileRemovalError {
  /**
   * Path of the file that failed to be removed
   */
  filePath: string;

  /**
   * Error message describing why removal failed
   */
  error: string;
}

export interface CleanResult {
  /**
   * Array of file paths that were successfully removed
   */
  removedFiles: string[];

  /**
   * Array of files that failed to be removed with error details
   */
  failedRemovals: FileRemovalError[];

  /**
   * Array of files that were located for removal
   */
  locatedFiles: string[];
}

export interface CleanOptions {
  /**
   * Whether to perform a dry run (no actual file deletions).
   * Defaults to false.
   */
  dryRun?: boolean;

  /**
   * Custom filters to apply when determining which files to remove.
   */
  versions: readonly string[];
}

export type StoreCapability = keyof StoreCapabilities;

export interface StoreCapabilities {
  /**
   * Whether the store supports analyzing its contents.
   */
  analyze: boolean;

  /**
   * Whether the store supports cleaning up orphaned or outdated files.
   */
  clean: boolean;

  /**
   * Whether the store supports mirroring files from remote to local.
   */
  mirror: boolean;

  /**
   * Whether the store supports repairing files (e.g., fixing corrupted files).
   */
  repair: boolean;
}
