import type { FSAdapter } from "./types";

/**
 * Creates a default file system adapter implementation using Node.js fs/promises module.
 *
 * This adapter provides basic file system operations needed for UCD file handling.
 * Currently, it only implements the readFile method, but could be extended with
 * additional functionality as needed.
 *
 * @returns {Promise<FSAdapter>} A Promise that resolves to a {@link FSAdapter} implementation
 * @throws Error if the Node.js fs module cannot be loaded
 */
export async function createDefaultFSAdapter(): Promise<FSAdapter> {
  try {
    const fsModule = await import("node:fs/promises");

    return {
      async readFile(path) {
        return fsModule.readFile(path, "utf-8");
      },
      async access(path, mode) {
        return fsModule.access(path, mode);
      },
      async mkdir(path, options) {
        fsModule.mkdir(path, options);
        return void 0;
      },
      async readdir(path) {
        return fsModule.readdir(path);
      },
      async rm(path, options) {
        return fsModule.rm(path, options);
      },
      async stat(path) {
        return fsModule.stat(path);
      },
      async unlink(path) {
        return fsModule.unlink(path);
      },
      async writeFile(path, data, encoding) {
        return fsModule.writeFile(path, data, { encoding });
      },
    };
  } catch (err) {
    throw new Error("Failed to load file system module", {
      cause: err,
    });
  }
}
