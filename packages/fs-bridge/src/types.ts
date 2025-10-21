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

export type FSEntry = {
  type: "file";
  name: string;
  path: string;
} | {
  type: "directory";
  name: string;
  path: string;
  children: FSEntry[];
};

export interface RequiredFileSystemBridgeOperations {
  /**
   * Reads the contents of a file.
   * @param {string} path - The path to the file to read
   * @returns {Promise<string>} A promise that resolves to the file contents as a string
   */
  read: (path: string) => Promise<string>;

  /**
   * Lists the contents of a directory.
   * @param {string} path - The path to the directory to list
   * @param {boolean} [recursive=false] - If true, lists files in subdirectories as well
   * @returns {Promise<FSEntry[]>} A promise that resolves to an array of file and directory entries
   */
  listdir: (path: string, recursive?: boolean) => Promise<FSEntry[]>;

  /**
   * Checks if a file or directory exists.
   * @param {string} path - The path to check for existence
   * @returns {Promise<boolean>} A promise that resolves to true if the path exists, false otherwise
   */
  exists: (path: string) => Promise<boolean>;
}

export interface OptionalFileSystemBridgeOperations {
  /**
   * Writes data to a file.
   * @param {string} path - The path to the file to write
   * @param {string | Uint8Array} data - The data to write to the file
   * @param {BufferEncoding} [encoding] - Optional encoding for the data (defaults to 'utf8')
   * @returns {Promise<void>} A promise that resolves when the write operation is complete
   */
  write?: (path: string, data: string | Uint8Array, encoding?: BufferEncoding) => Promise<void>;

  /**
   * Creates a directory.
   * @param {string} path - The path of the directory to create
   * @returns {Promise<void>} A promise that resolves when the directory is created
   */
  mkdir?: (path: string) => Promise<void>;

  /**
   * Removes a file or directory.
   * @param {string} path - The path to remove
   * @param {FileSystemBridgeRmOptions} [options] - Optional configuration for removal
   * @returns {Promise<void>} A promise that resolves when the removal is complete
   */
  rm?: (path: string, options?: FileSystemBridgeRmOptions) => Promise<void>;
}

export type FileSystemBridgeOperations = OptionalFileSystemBridgeOperations & RequiredFileSystemBridgeOperations;

export type RequiredCapabilityKey = keyof RequiredFileSystemBridgeOperations;
export type OptionalCapabilityKey = keyof OptionalFileSystemBridgeOperations;

export type HasOptionalCapabilityMap = Record<OptionalCapabilityKey, boolean>;

type ResolveSafePathFn = (basePath: string, inputPath: string) => string;

type FileSystemBridgeSetupFn<
  TOptionsSchema extends z.ZodType,
  TState extends Record<string, unknown> = Record<string, unknown>,
> = (ctx: {
  options: z.infer<TOptionsSchema>;
  state: TState;
  resolveSafePath: ResolveSafePathFn;
}) => FileSystemBridgeOperations;

export interface FileSystemBridgeMetadata {
  /**
   * A unique name for the file system bridge
   */
  name: string;

  /**
   * A brief description of the file system bridge
   */
  description: string;
}

export interface FileSystemBridgeObject<
  TOptionsSchema extends z.ZodType = z.ZodNever,
  TState extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * Metadata about the file system bridge
   */
  meta: FileSystemBridgeMetadata;

  /**
   * Zod schema for validating bridge options
   */
  optionsSchema?: TOptionsSchema;

  /**
   * Optional state object for the file system bridge.
   * This can be used to store any relevant state information
   * that the bridge implementation may need.
   * @type {Record<string, unknown>}
   * @default {}
   * @example
   * ```ts
   * import { FileSystemBridge } from "@ucdjs/fs-bridge";
   *
   * const fsBridge: FileSystemBridge = {
   *    state: {
   *     lastReadPath: "",
   *    },
   *    setup({ options, state }) {
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
  state?: TState;

  /**
   * Setup function that receives options, and state
   * and returns the filesystem operations implementation
   */
  setup: FileSystemBridgeSetupFn<TOptionsSchema, TState>;
}

export interface FileSystemBridge extends FileSystemBridgeOperations {
  /**
   * The capabilities of this file system bridge.
   */
  optionalCapabilities: HasOptionalCapabilityMap;

  /**
   * Metadata about this file system bridge.
   */
  meta: FileSystemBridgeMetadata;
}

export type FileSystemBridgeFactory<
  TOptionsSchema extends z.ZodType,
> = (
  ...args: [z.input<TOptionsSchema>] extends [never]
    ? []
    : undefined extends z.input<TOptionsSchema>
      ? [options?: z.input<TOptionsSchema>]
      : [options: z.input<TOptionsSchema>]
) => FileSystemBridge;
