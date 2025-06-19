export interface FileSystemBridge {
  /**
   * Reads the contents of a file.
   * @param {string} path - The path to the file to read
   * @returns {Promise<string>} A promise that resolves to the file contents as a string
   */
  read: (path: string) => Promise<string>;
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
