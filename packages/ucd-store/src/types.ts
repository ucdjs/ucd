import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";

export type StoreMode = "remote" | "local";

export interface BaseUCDStoreOptions {
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
   * - `@ucdjs/utils/fs-bridge/node` for Node.js environments
   * - `@ucdjs/utils/fs-bridge/http` for HTTP-based file systems (e.g., for remote stores)
   */
  fs: FileSystemBridge;
}

export interface internal_LocalUCDStoreOptions extends BaseUCDStoreOptions {
  mode: "local";

  /**
   * Base path for the local store
   *
   * @default "./ucd-files"
   */
  basePath?: string;

  /**
   * List of Unicode versions to include in the local store.
   * If not provided, defaults to all stable versions from UNICODE_VERSION_METADATA.
   */
  versions?: string[];
}

export interface internal_RemoteUCDStoreOptions extends BaseUCDStoreOptions {
  mode: "remote";
}

export type UCDStoreOptions = internal_LocalUCDStoreOptions | internal_RemoteUCDStoreOptions;

export type LocalUCDStoreOptions = Omit<internal_LocalUCDStoreOptions, "mode" | "fs"> & {
  /**
   * File System Bridge to use for local file operations.
   * If not provided, the Node.js file system bridge will be used.
   */
  fs?: FileSystemBridge;
};

export type RemoteUCDStoreOptions = Omit<internal_RemoteUCDStoreOptions, "mode" | "fs"> & {
  /**
   * File System Bridge to use for remote file operations.
   * If not provided, the HTTP file system bridge will be used with the default proxy URL.
   */
  fs?: FileSystemBridge;
};

export interface VersionAnalysis {
  /** Unicode version */
  version: string;
  /** Number of files found for this version */
  fileCount: number;
  /** Whether all expected files are present */
  isComplete: boolean;
  /** List of missing files (if any) */
  missingFiles?: string[];
  /** List of orphaned files (files that exist but shouldn't) */
  orphanedFiles?: string[];
}

export interface AnalyzeResultSuccess {
  success: true;
  /** Total number of files across all versions */
  totalFiles: number;
  /** Detailed analysis for each version */
  versions: VersionAnalysis[];
  /** Files that should be removed (orphaned/outdated) */
  filesToRemove: string[];
  /** Overall health status of the store */
  storeHealth: "healthy" | "needs_cleanup" | "corrupted";
}

export interface AnalyzeResultFailure {
  success: false;
  /** Global error that caused the analysis to fail */
  error: string;
  /** Partial results if some analysis was completed before failure */
  partialResults?: {
    totalFiles: number;
    versions: VersionAnalysis[];
    filesToRemove: string[];
  };
}

export type AnalyzeResult = AnalyzeResultSuccess | AnalyzeResultFailure;

export interface AnalyzeOptions {
  /**
   * Specific versions to analyze (if not provided, analyzes all)
   */
  versions?: string[];

  /**
   * Additional filters to apply during analysis
   */
  extraFilters?: string[];

  /**
   * Whether to check for orphaned files
   */
  checkOrphaned?: boolean;

  /**
   * Whether to calculate file sizes
   */
  calculateSizes?: boolean;
}

export interface FileRemovalError {
  /** Path of the file that failed to be removed */
  filePath: string;
  /** Error message describing why removal failed */
  error: string;
}

export interface CleanResult {
  /** Array of file paths that were successfully removed */
  removedFiles: string[];
  /** Array of files that failed to be removed with error details */
  failedRemovals: FileRemovalError[];
  /** Array of files that were located for removal */
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
