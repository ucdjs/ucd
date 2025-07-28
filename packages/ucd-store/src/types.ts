import type { FileSystemBridgeOperations } from "@ucdjs/fs-bridge";

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
   * - `@ucdjs/fs-bridge/node` for Node.js environments with full capabilities
   * - `@ucdjs/fs-bridge/http` for HTTP-based file systems (read-only)
   */
  fs: FileSystemBridgeOperations;

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
