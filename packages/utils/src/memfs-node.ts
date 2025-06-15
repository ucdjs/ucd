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

    async function exists(path: string): ReturnType<FSAdapter["exists"]> {
      try {
        await fsModule.access(path);
        return true;
      } catch {
        return false;
      }
    }

    return {
      async read(path: string) {
        return await fsModule.readFile(path, "utf-8");
      },
      async write(path: string, data: string) {
        await fsModule.writeFile(path, data, "utf-8");
      },
      async mkdir(path: string) {
        await fsModule.mkdir(path, { recursive: true });
      },
      async ensureDir(path: string) {
        try {
          if (await exists(path)) {
            return; // Directory already exists, no need to create
          }

          await fsModule.mkdir(path, { recursive: true });
        } catch (err: any) {
          if (err.code !== "EEXIST") {
            throw err;
          }
        }
      },
      async listdir(path: string, recursive: boolean = false) {
        return await fsModule.readdir(path, {
          recursive,
        });
      },
      exists,
      async rm(path: string) {
        await fsModule.rm(path, { recursive: true, force: true });
      },
      async stat(path: string) {
        return fsModule.stat(path);
      },
    };
  } catch (err) {
    throw new Error("Failed to load file system module", {
      cause: err,
    });
  }
}
