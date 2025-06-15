// ONLY STOW TYPES IN HERE WHEN THEY CAN'T BE COLOCATED WITH THE CODE THAT USES THEM

/**
 * Statistics information for a file or directory.
 */
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

/**
 * Options for creating directories.
 */
export interface MkdirOptions {
  /** If true, creates parent directories as needed */
  recursive?: boolean;
  /** Optional file mode (permissions) for the directory */
  mode?: number;
}

/**
 * Options for removing files and directories.
 */
export interface RmOptions {
  /** If true, removes directories and their contents recursively */
  recursive?: boolean;
  /** If true, ignores errors if the path doesn't exist */
  force?: boolean;
}

export interface FSAdapter {
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
   * Creates a directory.
   * @param {string} path - The path of the directory to create
   * @param {MkdirOptions} [options] - Optional configuration for directory creation
   * @returns {Promise<void>} A promise that resolves when the directory is created
   */
  mkdir: (path: string, options?: MkdirOptions) => Promise<void>;

  /**
   * Ensures that a directory exists, creating it if necessary.
   * @param {string} path - The path of the directory to ensure
   * @param {MkdirOptions} [options] - Optional configuration for directory creation
   * @returns {Promise<void>} A promise that resolves when the directory is ensured
   */
  ensureDir: (path: string, options?: MkdirOptions) => Promise<void>;

  /**
   * Lists the contents of a directory.
   * @param {string} path - The path to the directory to list
   * @param {boolean} [recursive=false] - If true, lists files in subdirectories as well
   * @returns {Promise<string[]>} A promise that resolves to an array of file and directory names
   */
  listdir: (path: string, recursive?: boolean) => Promise<string[]>;

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
   * @param {RmOptions} [options] - Optional configuration for removal
   * @returns {Promise<void>} A promise that resolves when the removal is complete
   */
  rm: (path: string, options?: RmOptions) => Promise<void>;
}
