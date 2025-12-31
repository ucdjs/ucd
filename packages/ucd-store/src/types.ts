import type { OperationResult, PathFilter, PathFilterOptions } from "@ucdjs-internal/shared";
import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge, FileSystemBridgeArgs, FileSystemBridgeFactory } from "@ucdjs/fs-bridge";
import type { UCDWellKnownConfig, UnicodeTreeNode } from "@ucdjs/schemas";
import type z from "zod";
import type { StoreError } from "./errors";
import type { GetFileOptions } from "./files/get";
import type { ListFilesOptions } from "./files/list";
import type { GetFileTreeOptions } from "./files/tree";
import type { AnalysisReport, AnalyzeOptions } from "./reports/analyze";
import type { CompareOptions, VersionComparison } from "./reports/compare";
import type { MirrorOptions, MirrorReport } from "./tasks/mirror";
import type { SyncOptions, SyncResult } from "./tasks/sync";

/**
 * Strategy for handling version conflicts when manifest exists and versions are provided.
 */
export type VersionConflictStrategy = "strict" | "merge" | "overwrite";

/**
 * Context available during bridge construction after endpoint discovery.
 */
export interface DiscoveryContext {
  /**
   * The resolved base URL for the API.
   */
  baseUrl: string;

  /**
   * The discovered endpoint configuration.
   */
  endpointConfig: UCDWellKnownConfig;

  /**
   * The resolved versions from config (if available).
   */
  versions: string[];
}

/**
 * Helper type to extract the options type from a FileSystemBridgeFactory.
 * Returns the first argument type, or `never` if the factory takes no arguments.
 */
type ExtractBridgeOptions<TSchema extends z.ZodType> = FileSystemBridgeArgs<TSchema>[0];

type FsOptionsInputFn<TSchema extends z.ZodType> = (ctx: DiscoveryContext) => ExtractBridgeOptions<TSchema>;

/**
 * Input type for fsOptions - can be static options or a function receiving DiscoveryContext.
 */
export type FsOptionsInput<TSchema extends z.ZodType>
  = [ExtractBridgeOptions<TSchema>] extends [never]
    ? never // Factory takes no arguments, fsOptions not allowed
    : ExtractBridgeOptions<TSchema> | FsOptionsInputFn<TSchema>;

export interface UCDStoreOptions<BridgeOptionsSchema extends z.ZodType> {
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
  fs: FileSystemBridgeFactory<BridgeOptionsSchema>;

  /**
   * Options to pass to the File System Bridge factory.
   * Can be static options or a function that receives the discovery context.
   *
   * TODO:
   * When using the function form, the options has some typing issues.
   * E.g. the function allows unspecified properties that are not in the schema.
   * This should be fixed to strictly enforce the schema shape.
   */
  fsOptions?: FsOptionsInput<BridgeOptionsSchema>;

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
   * Whether to enable bootstrap mode when no lockfile exists.
   * If false, store creation will fail if no lockfile is found.
   *
   * @default true
   */
  bootstrap?: boolean;

  /**
   * Whether to verify lockfile versions against the API.
   * If true, will check that all versions in the lockfile are still available.
   * Only applies when a lockfile already exists.
   *
   * @default true
   */
  verify?: boolean;

  /**
   * Strategy for handling version conflicts when lockfile exists and versions are provided.
   * - "strict": Throw error if provided versions differ from lockfile (default)
   * - "merge": Combine lockfile and provided versions, update lockfile
   * - "overwrite": Replace lockfile versions with provided versions, update lockfile
   *
   * Only applies when lockfile exists and versions are provided.
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
   * Lockfile-related state and configuration.
   */
  lockfile: {
    /**
     * Whether the file system bridge supports lockfile operations (write capability).
     */
    supports: boolean;

    /**
     * Whether a lockfile currently exists.
     */
    exists: boolean;

    /**
     * Path to the store lockfile.
     * Empty string if lockfile is not supported.
     */
    path: string;
  };

  /**
   * Version sources and resolution.
   */
  versions: {
    /**
     * The versions that were provided as input to createUCDStore.
     * Empty array if no versions were explicitly provided.
     */
    userProvided: readonly string[];

    /**
     * The versions from the resolved endpoint configuration.
     * Empty array if no config was available.
     */
    configFile: readonly string[];

    /**
     * Getter that lazily fetches and caches available versions from the API.
     * Returns a frozen array of version strings.
     */
    apiVersions: () => Promise<readonly string[]>;

    /**
     * The currently resolved/effective versions used for operations.
     */
    resolved: string[];
  };

  /**
   * Retrieves the expected file paths for a specific Unicode version from the API.
   *
   * @param version - The Unicode version to get expected file paths for
   * @returns A promise that resolves to an array of file paths
   */
  getExpectedFilePaths: (version: string) => Promise<string[]>;
}

export type UCDStoreContext = Readonly<Pick<InternalUCDStoreContext, "basePath" | "fs">> & {
  /**
   * List of Unicode versions available in the store.
   */
  versions: readonly string[];
};

export interface UCDStore extends UCDStoreContext, UCDStoreOperations {
}

/**
 * Options for store methods that support filtering
 */
export interface SharedOperationOptions {
  /**
   * Additional filters to apply on top of global filters
   */
  filters?: Pick<PathFilterOptions, "include" | "exclude">;
}

/**
 * File operations namespace for the store.
 * Provides methods for accessing and manipulating Unicode data files.
 */
export interface UCDStoreFileOperations {
  /**
   * Get a specific file for a Unicode version.
   * Tries local FS first, then falls back to API.
   */
  get: (version: string, path: string, options?: GetFileOptions) => Promise<OperationResult<string, StoreError>>;

  /**
   * List all file paths for a Unicode version.
   * Returns a flat array of file paths.
   */
  list: (version: string, options?: ListFilesOptions) => Promise<OperationResult<string[], StoreError>>;

  /**
   * Get the file tree structure for a Unicode version.
   * Returns a hierarchical tree of files and directories.
   */
  tree: (version: string, options?: GetFileTreeOptions) => Promise<OperationResult<UnicodeTreeNode[], StoreError>>;
}

export interface UCDStoreOperations {
  /**
   * Synchronizes the store lockfile with available versions from API and mirrors files.
   * Updates lockfile with new versions, downloads missing files, and optionally removes orphaned files/unavailable versions.
   *
   * Example: Fetches available versions from API, updates lockfile, mirrors files, and optionally cleans up orphaned files.
   *
   * @experimental This method is under development and may change
   */
  sync: (options?: SyncOptions) => Promise<OperationResult<SyncResult, StoreError>>;

  /**
   * Mirrors Unicode data files from the API to local storage.
   * This is a file-level operation that downloads actual Unicode data for specified versions.
   *
   * Example: Downloads all .txt files for version 16.0.0 to local storage.
   *
   * @experimental This method is under development and may change
   */
  mirror: (options?: MirrorOptions) => Promise<OperationResult<MirrorReport, StoreError>>;

  /**
   * Analyzes Unicode data in the store.
   *
   * @experimental This method is under development and may change
   */
  analyze: (options?: AnalyzeOptions) => Promise<OperationResult<Map<string, AnalysisReport>, StoreError>>;

  /**
   * Compares two versions in the store and returns a summary of added/removed/modified/unchanged files.
   *
   * @example
   * store.compare({ from: "15.1.0", to: "16.0.0" })
   *
   * @experimental This method is under development and may change
   */
  compare: (options?: CompareOptions) => Promise<OperationResult<VersionComparison, StoreError>>;

  /**
   * File operations namespace
   */
  files: UCDStoreFileOperations;
}
