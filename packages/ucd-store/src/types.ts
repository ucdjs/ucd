import type { OperationResult, PathFilter, PathFilterOptions } from "@ucdjs-internal/shared";
import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { UCDWellKnownConfig, UnicodeTreeNode } from "@ucdjs/schemas";
import type { StoreError } from "./errors";

/**
 * Strategy for handling version conflicts when manifest exists and versions are provided.
 */
export type VersionConflictStrategy = "strict" | "merge" | "overwrite";

export interface UCDStoreOptions {
  /**
   * Base URL for the Unicode API
   *
   * @default "https://api.ucdjs.dev"
   */
  baseUrl?: string;

  /**
   * Optional pre-initialized UCD client instance.
   * If provided, this client will be used instead of creating a new one.
   * The baseUrl and endpointConfig options will be ignored if a client is provided.
   */
  client?: UCDClient;

  /**
   * Optional endpoint configuration for the UCD API.
   * If not provided, will use default configuration or discover from API in bootstrap mode.
   */
  endpointConfig?: UCDWellKnownConfig;

  /**
   * Optional filters to apply when fetching Unicode data.
   * These can be used to limit the data fetched from the API.
   */
  globalFilters?: PathFilterOptions;

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

  /**
   * Whether to enable bootstrap mode when no manifest exists.
   * If false, store creation will fail if no manifest is found.
   *
   * @default true
   */
  bootstrap?: boolean;

  /**
   * Whether to verify manifest versions against the API.
   * If true, will check that all versions in the manifest are still available.
   * Only applies when a manifest already exists.
   *
   * @default false
   */
  verify?: boolean;

  /**
   * Strategy for handling version conflicts when manifest exists and versions are provided.
   * - "strict": Throw error if provided versions differ from manifest (default)
   * - "merge": Combine manifest and provided versions, update manifest
   * - "overwrite": Replace manifest versions with provided versions, update manifest
   *
   * Only applies when manifest exists and versions are provided.
   *
   * @default "strict"
   */
  versionStrategy?: VersionConflictStrategy;
}

/**
 * Internal store context to be passed
 *
 * @internal
 */
export interface InternalUCDStoreContext {
  /**
   * UCD API client instance.
   */
  client: UCDClient;

  /**
   * Path filter to apply when fetching files.
   */
  filter: PathFilter;

  /**
   * File system bridge for file operations.
   */
  fs: FileSystemBridge;

  /**
   * Base path where store files are located.
   */
  basePath: string;

  /**
   * List of Unicode versions available in the store.
   */
  versions: string[];

  /**
   * Path to the store manifest file.
   */
  manifestPath: string;
}

export type UCDStoreContext = Readonly<Pick<InternalUCDStoreContext, "basePath" | "fs">> & {
  /**
   * List of Unicode versions available in the store.
   */
  versions: readonly string[];
};

export interface UCDStore extends UCDStoreContext, UCDStoreMethods, UCDStoreOperations {
}

/**
 * Options for store methods that support filtering
 */
export interface StoreMethodOptions {
  /**
   * Additional filters to apply on top of global filters
   */
  filters?: Pick<PathFilterOptions, "include" | "exclude">;
}

/**
 * Options for the getFile method
 */
export interface GetFileOptions extends StoreMethodOptions {
  /**
   * Whether to cache the file to local FS if available
   * @default true
   */
  cache?: boolean;
}

export interface UCDStoreMethods {
  getFileTree: (version: string, options?: StoreMethodOptions) => Promise<OperationResult<UnicodeTreeNode[], StoreError>>;
  getFilePaths: (version: string, options?: StoreMethodOptions) => Promise<OperationResult<string[], StoreError>>;
  getFile: (version: string, filePath: string, options?: GetFileOptions) => Promise<OperationResult<string, StoreError>>;
}

export interface UCDStoreOperations {
  /**
   * @deprecated This needs to be implemented properly
   */
  analyze: (options: never) => Promise<OperationResult<never[], StoreError>>;

}
