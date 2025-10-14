import type { OperationResult, PathFilter, PathFilterOptions } from "@ucdjs-internal/shared";
import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { UnicodeTreeNode } from "@ucdjs/schemas";
import type { StoreError } from "../errors";

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
   * The baseUrl option will be ignored if a client is provided.
   */
  client?: UCDClient;

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
}

export interface UCDStoreContext {
  client: UCDClient;
  filter: PathFilter;
  fs: FileSystemBridge;
  basePath: string;
  versions: string[];
  manifestPath: string;
}

export interface UCDStoreV2 extends UCDStoreContext, UCDStoreMethods, UCDStoreOperations {}

export interface UCDStoreMethods {
  getFileTree: (version: string, extraFilters?: Pick<PathFilterOptions, "include" | "exclude">) => Promise<OperationResult<UnicodeTreeNode[], StoreError>>;
  getFilePaths: (version: string, extraFilters?: Pick<PathFilterOptions, "include" | "exclude">) => Promise<OperationResult<string[], StoreError>>;
  getFile: (version: string, filePath: string, extraFilters?: Pick<PathFilterOptions, "include" | "exclude">) => Promise<OperationResult<string, StoreError>>;
}

export interface UCDStoreOperations {
  /**
   * @deprecated This needs to be implemented properly
   */
  analyze: (options: never) => Promise<OperationResult<never[], StoreError>>;

}
