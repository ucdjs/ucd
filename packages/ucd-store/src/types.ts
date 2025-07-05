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
