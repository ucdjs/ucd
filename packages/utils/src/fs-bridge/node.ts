import type { FSEntry } from "../fs-bridge";
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
  capabilities: {
    read: true,
    write: true,
    listdir: true,
    mkdir: true,
    stat: true,
    exists: true,
    rm: true,
  },
  read(path) {
    return readFile(path, "utf-8");
  },
  exists(path) {
    return safeExists(path);
  },
  async listdir(path, recursive): Promise<FSEntry[]> {
    const entries = await readdir(path, {
      recursive: recursive ?? false,
      withFileTypes: true,
    });

    return entries.map((entry): FSEntry => ({
      name: entry.name,
      path: recursive ? `${entry.parentPath}/${entry.name}` : entry.name,
      type: entry.isDirectory() ? "directory" : "file",
    }));
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
      recursive: options?.recursive ?? false,
      force: options?.force ?? false,
    });
  },
  async stat(path) {
    return stat(path);
  },
});

export default NodeFileSystemBridge;
