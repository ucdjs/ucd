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

export interface SharedStoreOperationOptions {
  /**
   * List of Unicode versions to include in the operation.
   * If not provided, the operation will include all available versions.
   */
  versions?: string[];

  /**
   * Whether to perform a dry run without actually writing files.
   * This is useful for testing and debugging the store actions.
   */
  dryRun?: boolean;

  /**
   * Concurrency level for file operations.
   * This controls how many files can be processed in parallel.
   * Higher values may speed up the process but can also increase resource usage.
   */
  concurrency?: number;
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
