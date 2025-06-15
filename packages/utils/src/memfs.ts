import type { FSAdapter } from "./types";
import { invariant } from "@luxass/utils";
import { createFsFromVolume, Volume } from "memfs";

export type CreateFileSystemOptions =
  | {
    type?: "memfs";
    initialFiles?: Record<string, string>;
    fs?: never;
  }
  | {
    type: "custom";
    initialFiles?: never;
    fs: FSAdapter;
  };

/**
 * Creates a file system instance that provides a unified API for file operations.
 *
 * @param options - Configuration options for creating the file system
 * @param {("memfs" | "custom")} [options.type] - The type of file system to create: "memfs" (in-memory) or "custom"
 * @param {Record<string, string>} [options.initialFiles] - A record of initial files to populate the file system with, where keys are file paths and values are file contents
 * @param {FSAdapter} [options.fs] - A custom file system instance to use when type is "custom"
 * @returns {FSAdapter} A file system instance with methods for common file operations
 * @throws {Error} When type is "custom" but no fsInstance is provided
 * @throws {Error} When an unsupported file system type is specified
 */
export function createFileSystem(options: CreateFileSystemOptions = {}): FSAdapter {
  const { type = "memfs", fs } = options;

  if (type === "custom") {
    if (!fs) {
      throw new Error("fs must be provided when type is \"custom\".");
    }
    return fs;
  }

  if (type === "memfs") {
    const vol = Volume.fromJSON(options.initialFiles || {});
    const memfs = createFsFromVolume(vol);

    async function exists(path: string): ReturnType<FSAdapter["exists"]> {
      try {
        await memfs.promises
          .access(path);
        return true;
      } catch {
        return false;
      }
    }

    return {
      async read(path: string) {
        const result = await memfs.promises.readFile(path, {
          encoding: "utf-8",
        });

        invariant(typeof result === "string", `Expected string result from readFile, got ${typeof result}`);

        return result;
      },
      async write(path: string, data: string, encoding: BufferEncoding = "utf-8") {
        await memfs.promises.writeFile(path, data, { encoding });
      },
      async mkdir(path: string, options?: { recursive?: boolean; mode?: number }) {
        await memfs.promises.mkdir(path, options);
      },
      async ensureDir(path: string, options?: { recursive?: boolean; mode?: number }) {
        try {
          if (await exists(path)) {
            return; // Directory already exists, no need to create
          }
          await memfs.promises.mkdir(path, options);
        } catch (err: any) {
          if (err.code !== "EEXIST") {
            throw err;
          }
        }
      },
      async listdir(path: string, recursive: boolean = false) {
        const result = await memfs.promises.readdir(path, {
          recursive,
        });
        return result as string[];
      },
      async stat(path: string) {
        const result = await memfs.promises.stat(path);
        return {
          isFile: () => result.isFile(),
          isDirectory: () => result.isDirectory(),
          mtime: result.mtime as Date,
          size: result.size as number,
        };
      },
      async exists(path: string) {
        return exists(path);
      },
      async rm(path: string, options?: { recursive?: boolean; force?: boolean }) {
        await memfs.promises.rm(path, options);
      },
    };
  }

  throw new Error(`Unsupported file system type: ${type}. Use "memfs" or "custom".`);
}
