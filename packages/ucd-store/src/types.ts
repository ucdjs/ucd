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
  /** Total size of files for this version in bytes */
  totalSize?: number;
}

export interface AnalyzeResultSuccess {
  success: true;
  /** Total number of files across all versions */
  totalFiles: number;
  /** Total size of all files in bytes */
  totalSize: number;
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
    totalSize: number;
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

export interface FileRemovalResult {
  /** Path of the file */
  path: string;
  /** Whether the file was successfully removed */
  removed: boolean;
  /** Error message if removal failed */
  error?: string;
  /** Size of the file in bytes (if available) */
  size?: number;
}

export interface CleanResultSuccess {
  success: true;
  /** List of all files that were targeted for removal */
  filesToRemove: string[];
  /** Detailed results for each file removal attempt */
  fileResults: FileRemovalResult[];
  /** Successfully removed files */
  removedFiles: string[];
  /** Files that couldn't be removed */
  failedRemovals: FileRemovalResult[];
  /** Total number of files successfully deleted */
  deletedCount: number;
  /** Total size freed in bytes */
  freedBytes: number;
}

export interface CleanResultFailure {
  success: false;
  /** Global error that caused the entire operation to fail */
  error: string;
  /** Partial results if some files were processed before failure */
  partialResults?: {
    filesToRemove: string[];
    fileResults: FileRemovalResult[];
    removedFiles: string[];
    failedRemovals: FileRemovalResult[];
    deletedCount: number;
    freedBytes: number;
  };
}

export type CleanResult = CleanResultSuccess | CleanResultFailure;

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
