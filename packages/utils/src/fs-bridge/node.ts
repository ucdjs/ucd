import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { defineFileSystemBridge } from "../fs-bridge";

async function safeExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Node.js implementation of the file system bridge.
 *
 * This bridge uses Node.js built-in filesystem modules to implement
 * file operations like reading, writing, and managing directories.
 * It provides a consistent interface for interacting with the filesystem
 * in Node.js environments.
 *
 * @see defineFileSystemBridge
 */
const NodeFileSystemBridge = defineFileSystemBridge({
  read(path) {
    return readFile(path, "utf-8");
  },
  exists(path) {
    return safeExists(path);
  },
  async listdir(path, recursive) {
    return readdir(path, {
      recursive: recursive ?? false,
    });
  },
  async write(path, data, encoding = "utf-8") {
    return writeFile(path, data, { encoding });
  },
  async mkdir(path) {
    // mkdir returns the first directory path, when recursive is true
    await mkdir(path, { recursive: true });
    return void 0;
  },
  async rm(path, options) {
    return rm(path, {
      recursive: options?.recursive ?? true,
      force: options?.force ?? true,
    });
  },
  async stat(path) {
    return stat(path);
  },
});

export default NodeFileSystemBridge;
