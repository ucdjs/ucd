import type { FSAdapter, FSStats, MkdirOptions, RmOptions } from "./types";
import { invariant } from "@luxass/utils";
import { createFsFromVolume, Volume } from "memfs";

export type CreateFileSystemOptions =
  | {
    type?: "memfs";
    initialFiles?: Record<string, string>;
    fs?: never;
  }
  | {
    type: "node";
    initialFiles?: never;
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
 * @param {("memfs" | "node" | "custom")} [options.type] - The type of file system to create: "memfs" (in-memory, default), "node" (Node.js fs), or "custom"
 * @param {Record<string, string>} [options.initialFiles] - A record of initial files to populate the file system with, where keys are file paths and values are file contents (only for memfs)
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

  if (type === "node") {
    return createNodeAdapter();
  }

  if (type === "memfs") {
    return createMemfsAdapter(options.initialFiles || {});
  }

  throw new Error(`Unsupported file system type: ${type}. Use "memfs", "node", or "custom".`);
}

function createNodeAdapter(): FSAdapter {
  // Lazy loading of Node.js fs module
  let nodeFs: typeof import("node:fs/promises") | null = null;
  const getFs = async (): Promise<typeof import("node:fs/promises")> => {
    if (!nodeFs) {
      try {
        nodeFs = await import("node:fs/promises");
      } catch (err) {
        throw new Error("Failed to load Node.js fs module. Make sure you're running in a Node.js environment.", {
          cause: err,
        });
      }
    }
    return nodeFs;
  };

  async function exists(path: string): Promise<boolean> {
    try {
      const fs = await getFs();
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async function ensureDir(path: string, options?: MkdirOptions): Promise<void> {
    try {
      if (await exists(path)) {
        return;
      }
      const fs = await getFs();
      await fs.mkdir(path, { recursive: true, ...options });
    } catch (err: any) {
      if (err.code !== "EEXIST") {
        throw err;
      }
    }
  }

  return {
    async read(path: string) {
      const fs = await getFs();
      return await fs.readFile(path, "utf-8");
    },
    async write(path: string, data: string, encoding: BufferEncoding = "utf-8") {
      const fs = await getFs();
      await fs.writeFile(path, data, encoding);
    },
    async mkdir(path: string, options?: MkdirOptions) {
      const fs = await getFs();
      await fs.mkdir(path, options);
    },
    ensureDir,
    async listdir(path: string, recursive: boolean = false) {
      const fs = await getFs();
      const result = await fs.readdir(path, { recursive });
      return result as string[];
    },
    async stat(path: string): Promise<FSStats> {
      const fs = await getFs();
      const result = await fs.stat(path);
      return {
        isFile: () => result.isFile(),
        isDirectory: () => result.isDirectory(),
        mtime: result.mtime as Date,
        size: result.size as number,
      };
    },
    exists,
    async rm(path: string, options?: RmOptions) {
      const fs = await getFs();
      await fs.rm(path, { recursive: true, force: true, ...options });
    },
  };
}

function createMemfsAdapter(initialFiles: Record<string, string>): FSAdapter {
  const vol = Volume.fromJSON(initialFiles);
  const memfs = createFsFromVolume(vol);
  const fs = memfs.promises;

  async function exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async function ensureDir(path: string, options?: MkdirOptions): Promise<void> {
    try {
      if (await exists(path)) {
        return;
      }
      await fs.mkdir(path, { recursive: true, ...options });
    } catch (err: any) {
      if (err.code !== "EEXIST") {
        throw err;
      }
    }
  }

  return {
    async read(path: string) {
      const result = await fs.readFile(path, { encoding: "utf-8" });
      invariant(typeof result === "string", `Expected string result from readFile, got ${typeof result}`);
      return result;
    },
    async write(path: string, data: string, encoding: BufferEncoding = "utf-8") {
      await fs.writeFile(path, data, { encoding });
    },
    async mkdir(path: string, options?: MkdirOptions) {
      await fs.mkdir(path, options);
    },
    ensureDir,
    async listdir(path: string, recursive: boolean = false) {
      const result = await fs.readdir(path, { recursive });
      return result as string[];
    },
    async stat(path: string): Promise<FSStats> {
      const result = await fs.stat(path);
      return {
        isFile: () => result.isFile(),
        isDirectory: () => result.isDirectory(),
        mtime: result.mtime as Date,
        size: result.size as number,
      };
    },
    exists,
    async rm(path: string, options?: RmOptions) {
      await fs.rm(path, options);
    },
  };
}
