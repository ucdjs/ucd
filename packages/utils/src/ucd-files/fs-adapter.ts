import type { FSAdapter } from "../types";

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
      async mkdir(dirPath, options) {
        return fsModule.mkdir(dirPath, options);
      },
      async ensureDir(dirPath) {
        try {
          await fsModule.mkdir(dirPath, { recursive: true });
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code !== "EEXIST") {
            throw err;
          }
        }
      },
      async writeFile(filePath, data) {
        await fsModule.writeFile(filePath, data, "utf-8");
      },
      async exists(filePath) {
        try {
          await fsModule.access(filePath);
          return true;
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            return false;
          }
          throw err; // rethrow other errors
        }
      },
      async readdir(dirPath, recursive = false) {
        return fsModule.readdir(dirPath, {
          recursive,
        });
      },
    };
  } catch (err) {
    throw new Error("Failed to load file system module", {
      cause: err,
    });
  }
}
