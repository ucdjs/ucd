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

export interface InitOptions {
  /**
   * Whether to force overwrite existing store manifest and directories.
   * When true, existing manifest will be recreated even if it already exists.
   */
  force?: boolean;

  /**
   * Whether to perform a dry run without actually creating files or directories.
   * This is useful for testing and debugging the initialization process.
   */
  dryRun?: boolean;
}
