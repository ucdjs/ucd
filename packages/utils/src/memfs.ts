import { invariant } from "@luxass/utils";
import { createFsFromVolume, Volume } from "memfs";

export interface FSAdapter {
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, data: string, encoding?: BufferEncoding) => Promise<void>;
  mkdir: (path: string, options?: { recursive?: boolean; mode?: number }) => Promise<void>;
  readdir: (path: string) => Promise<string[]>;
  stat: (path: string) => Promise<{ isFile: () => boolean; isDirectory: () => boolean; mtime: Date; size: number }>;
  unlink: (path: string) => Promise<void>;
  access: (path: string, mode?: number) => Promise<void>;
  rm: (path: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>;
  copyFile: (src: string, dest: string, mode?: number) => Promise<void>;
}

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

    return {
      readFile: async (path: string) => {
        const result = await memfs.promises.readFile(path, {
          encoding: "utf-8",
        });

        invariant(result !== null, `File not found: ${path}`);
        invariant(typeof result === "string", `Expected string result from readFile, got ${typeof result}`);

        return result;
      },
      writeFile: async (path: string, data: string, encoding: BufferEncoding = "utf-8") => {
        await memfs.promises.writeFile(path, data, { encoding });
      },
      mkdir: async (path: string, options?: { recursive?: boolean; mode?: number }) => {
        await memfs.promises.mkdir(path, options);
      },
      readdir: async (path: string) => {
        const result = await memfs.promises.readdir(path);
        return result as string[];
      },
      stat: async (path: string) => {
        const result = await memfs.promises.stat(path);
        return {
          isFile: () => result.isFile(),
          isDirectory: () => result.isDirectory(),
          mtime: result.mtime as Date,
          size: result.size as number,
        };
      },
      unlink: async (path: string) => {
        await memfs.promises.unlink(path);
      },
      access: async (path: string, mode?: number) => {
        await memfs.promises.access(path, mode);
      },
      rm: async (path: string, options?: { recursive?: boolean; force?: boolean }) => {
        await memfs.promises.rm(path, options);
      },
      copyFile: async (src: string, dest: string, mode?: number) => {
        await memfs.promises.copyFile(src, dest, mode);
      },
    };
  }

  throw new Error(`Unsupported file system type: ${type}. Use "memfs" or "custom".`);
}
