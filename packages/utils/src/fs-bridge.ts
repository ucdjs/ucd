import type { z } from "zod";

export interface FileSystemBridgeRmOptions {
  /**
   * If true, removes directories and their contents recursively
   */
  recursive?: boolean;

  /**
   * If true, ignores errors if the path doesn't exist
   */
  force?: boolean;
}

export interface FileSystemBridgeOperations {
  /**
   * Reads the contents of a file.
   * @param {string} path - The path to the file to read
   * @returns {Promise<string>} A promise that resolves to the file contents as a string
   */
  read: (path: string) => Promise<string>;

  /**
   * Writes data to a file.
   * @param {string} path - The path to the file to write
   * @param {string} data - The data to write to the file
   * @param {BufferEncoding} [encoding] - Optional encoding for the data (defaults to 'utf8')
   * @returns {Promise<void>} A promise that resolves when the write operation is complete
   */
  write: (path: string, data: string, encoding?: BufferEncoding) => Promise<void>;

  /**
   * Lists the contents of a directory.
   * @param {string} path - The path to the directory to list
   * @param {boolean} [recursive=false] - If true, lists files in subdirectories as well
   * @returns {Promise<string[]>} A promise that resolves to an array of file and directory names
   */
  listdir: (path: string, recursive?: boolean) => Promise<string[]>;

  /**
   * Creates a directory.
   * @param {string} path - The path of the directory to create
   * @returns {Promise<void>} A promise that resolves when the directory is created
   */
  mkdir: (path: string) => Promise<void>;

  /**
   * Checks if a file or directory exists.
   * @param {string} path - The path to check for existence
   * @returns {Promise<boolean>} A promise that resolves to true if the path exists, false otherwise
   */
  exists: (path: string) => Promise<boolean>;

  /**
   * Removes a file or directory.
   * @param {string} path - The path to remove
   * @param {FileSystemBridgeRmOptions} [options] - Optional configuration for removal
   * @returns {Promise<void>} A promise that resolves when the removal is complete
   */
  rm: (path: string, options?: FileSystemBridgeRmOptions) => Promise<void>;
}

export type FileSystemBridgeCapabilityKey = keyof FileSystemBridgeOperations;
export type FileSystemBridgeCapabilities = {
  [K in FileSystemBridgeCapabilityKey]: boolean;
};

const DEFAULT_SUPPORTED_CAPABILITIES: FileSystemBridgeCapabilities = {
  exists: true,
  read: true,
  write: true,
  listdir: true,
  mkdir: true,
  rm: true,
};

type FileSystemBridgeSetup<TOptions extends z.ZodObject> = (ctx: {
  options: z.infer<TOptions>;
  state: Record<string, unknown>;
  capabilities: FileSystemBridgeCapabilities;
}) => FileSystemBridgeOperations;

export interface FileSystemBridge<TOptions extends z.ZodObject = z.ZodObject> {
  /**
   * Zod schema for validating bridge options
   */
  optionsSchema?: TOptions;

  /**
   * An object defining the capabilities supported by this file system bridge.
   * If it is not provided, the bridge will assume all capabilities are supported.
   */
  capabilities?: FileSystemBridgeCapabilities;

  /**
   * Optional state object for the file system bridge.
   * This can be used to store any relevant state information
   * that the bridge implementation may need.
   * @type {Record<string, unknown>}
   * @default {}
   * @example
   * ```ts
   * import { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
   *
   * const fsBridge: FileSystemBridge = {
   *    state: {
   *     lastReadPath: "",
   *    },
   *    setup({ options, state, capabilities }) {
   *      return {
   *        async read(path) {
   *          state.lastReadPath = path;
   *          // ... implementation
   *        }
   *      }
   *    }
   * }
   * ```
   */
  state?: Record<string, unknown>;

  /**
   * Setup function that receives options, state, and capabilities
   * and returns the filesystem operations implementation
   */
  setup: FileSystemBridgeSetup<TOptions>;
}

/**
 * Defines and returns a file system bridge implementation.
 *
 * This function serves as a type-safe way to create a file system bridge
 * that follows the {@link FileSystemBridge} interface.
 *
 * @param {FileSystemBridge<TOptions>} fsBridge - The file system bridge implementation to define
 * @returns {FileSystemBridge<TOptions>} The provided file system bridge implementation
 */
export function defineFileSystemBridge<TOptions extends z.ZodObject>(
  fsBridge: FileSystemBridge<TOptions>,
): FileSystemBridge<TOptions> {
  return fsBridge;
}

/**
 * Gets the supported capabilities for a file system bridge.
 *
 * If the bridge doesn't specify its capabilities, this function returns
 * the default set of supported capabilities (all capabilities enabled).
 *
 * @param {FileSystemBridge} fsBridge - The file system bridge to get capabilities for
 * @returns {FileSystemBridgeCapabilities} An object indicating which capabilities are supported by the bridge
 */
export function getSupportedBridgeCapabilities(fsBridge: FileSystemBridge): FileSystemBridgeCapabilities {
  return fsBridge?.capabilities || DEFAULT_SUPPORTED_CAPABILITIES;
}
