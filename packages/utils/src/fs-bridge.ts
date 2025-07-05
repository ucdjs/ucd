export interface FileSystemBridgeRmOptions {
  /** If true, removes directories and their contents recursively */
  recursive?: boolean;
  /** If true, ignores errors if the path doesn't exist */
  force?: boolean;
}

export interface FSStats {
  /** Returns true if the path is a file */
  isFile: () => boolean;
  /** Returns true if the path is a directory */
  isDirectory: () => boolean;
  /** The last modified time */
  mtime: Date;
  /** The size in bytes */
  size: number;
}

export interface FSEntry {
  /**
   * The name of the entry
   * @example "file.txt" or "directory"
   */
  name: string;

  /**
   * The path of the entry
   */
  path: string;

  /**
   *  The type of the entry
   */
  type: "file" | "directory";
}

export interface FileSystemBridge {
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
   *    async read(path) {
   *      this.state.lastReadPath = path;
   *    }
   * }
   * ```
   */
  state?: Record<string, unknown>;

  /**
   * Optional object that defines which functions are supported by the bridge.
   */
  supportedFunctions?: {
    read: boolean;
    write: boolean;
    listdir: boolean;
    mkdir: boolean;
    stat: boolean;
    exists: boolean;
    rm: boolean;
  };

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
   * @returns {Promise<FSEntry[]>} A promise that resolves to an array of file and directory entries
   */
  listdir: (path: string, recursive?: boolean) => Promise<FSEntry[]>;

  /**
   * Creates a directory.
   * @param {string} path - The path of the directory to create
   * @returns {Promise<void>} A promise that resolves when the directory is created
   */
  mkdir: (path: string) => Promise<void>;

  /**
   * Gets file or directory statistics.
   * @param {string} path - The path to get statistics for
   * @returns {Promise<FSStats>} A promise that resolves to an object containing file/directory information
   */
  stat: (path: string) => Promise<FSStats>;

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

/**
 * Defines and returns a file system bridge implementation.
 *
 * This function serves as a type-safe way to create a file system bridge
 * that follows the {@link FileSystemBridge} interface.
 *
 * @param {FileSystemBridge} fsBridge - The file system bridge implementation to define
 * @returns {FileSystemBridge} The provided file system bridge implementation
 */
export function defineFileSystemBridge(fsBridge: FileSystemBridge): FileSystemBridge {
  return fsBridge;
}
