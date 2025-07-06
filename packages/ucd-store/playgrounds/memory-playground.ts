/* eslint-disable antfu/no-top-level-await */

import type { FSEntry, FSStats } from "@ucdjs/utils/fs-bridge";
import assert from "node:assert";
import { dirname, join } from "node:path";
import { defineFileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { createUCDStore } from "../src/factory";
import { UCDStore } from "../src/store";
import { createLogger } from "./_utils";

const log = createLogger("memory-playground");

// In-memory filesystem implementation
interface MemoryFSEntry {
  type: "file" | "directory";
  content?: string;
  children?: Map<string, MemoryFSEntry>;
  mtime: Date;
  size: number;
}

const memoryFS = new Map<string, MemoryFSEntry>();

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/");
}

function getParentPath(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split("/").filter(Boolean);
  return parts.length > 1 ? `/${parts.slice(0, -1).join("/")}` : "/";
}

function getFileName(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function ensureParentExists(path: string): void {
  const parentPath = getParentPath(path);
  if (parentPath !== "/" && !memoryFS.has(parentPath)) {
    ensureParentExists(parentPath);
    memoryFS.set(parentPath, {
      type: "directory",
      children: new Map(),
      mtime: new Date(),
      size: 0,
    });
  }
}

const MemoryFileSystemBridge = defineFileSystemBridge({
  capabilities: {
    read: true,
    write: true,
    listdir: true,
    mkdir: true,
    stat: true,
    exists: true,
    rm: true,
  },

  async read(path: string): Promise<string> {
    const normalizedPath = normalizePath(path);
    const entry = memoryFS.get(normalizedPath);

    if (!entry) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }

    if (entry.type !== "file") {
      throw new Error(`EISDIR: illegal operation on a directory, read '${path}'`);
    }

    return entry.content || "";
  },

  async write(path: string, data: string): Promise<void> {
    const normalizedPath = normalizePath(path);
    ensureParentExists(normalizedPath);

    memoryFS.set(normalizedPath, {
      type: "file",
      content: data,
      mtime: new Date(),
      size: data.length,
    });
  },

  async exists(path: string): Promise<boolean> {
    const normalizedPath = normalizePath(path);
    return memoryFS.has(normalizedPath);
  },

  async listdir(path: string, recursive = false): Promise<FSEntry[]> {
    const normalizedPath = normalizePath(path);
    const entry = memoryFS.get(normalizedPath);

    if (!entry) {
      throw new Error(`ENOENT: no such file or directory, scandir '${path}'`);
    }

    if (entry.type !== "directory") {
      throw new Error(`ENOTDIR: not a directory, scandir '${path}'`);
    }

    const results: FSEntry[] = [];

    for (const [fullPath, childEntry] of memoryFS.entries()) {
      if (fullPath.startsWith(`${normalizedPath}/`)) {
        const relativePath = fullPath.slice(normalizedPath.length + 1);

        if (!recursive && relativePath.includes("/")) {
          continue;
        }

        const name = getFileName(fullPath);
        results.push({
          name,
          path: recursive ? relativePath : name,
          type: childEntry.type,
        });
      }
    }

    return results;
  },

  async mkdir(path: string): Promise<void> {
    const normalizedPath = normalizePath(path);
    ensureParentExists(normalizedPath);

    if (!memoryFS.has(normalizedPath)) {
      memoryFS.set(normalizedPath, {
        type: "directory",
        children: new Map(),
        mtime: new Date(),
        size: 0,
      });
    }
  },

  async stat(path: string): Promise<FSStats> {
    const normalizedPath = normalizePath(path);
    const entry = memoryFS.get(normalizedPath);

    if (!entry) {
      throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
    }

    return {
      isFile: () => entry.type === "file",
      isDirectory: () => entry.type === "directory",
      mtime: entry.mtime,
      size: entry.size,
    };
  },

  async rm(path: string, options = {}): Promise<void> {
    const normalizedPath = normalizePath(path);
    const entry = memoryFS.get(normalizedPath);

    if (!entry) {
      if (options.force) {
        return;
      }
      throw new Error(`ENOENT: no such file or directory, unlink '${path}'`);
    }

    if (entry.type === "directory" && !options.recursive) {
      // Check if directory is empty
      const hasChildren = Array.from(memoryFS.keys()).some((key) =>
        key.startsWith(`${normalizedPath}/`),
      );

      if (hasChildren) {
        throw new Error(`ENOTEMPTY: directory not empty, rmdir '${path}'`);
      }
    }

    // Remove the entry and all its children
    const keysToRemove = Array.from(memoryFS.keys()).filter((key) =>
      key === normalizedPath || key.startsWith(`${normalizedPath}/`),
    );

    for (const key of keysToRemove) {
      memoryFS.delete(key);
    }
  },
});

log.info("Starting Memory Playground for UCD Store");

// Initialize root directory
await MemoryFileSystemBridge.mkdir("/");

const store = await createUCDStore({
  basePath: "/ucd-data",
  fs: MemoryFileSystemBridge,
});

log.info("UCD Store created successfully");

assert(store instanceof UCDStore, "store should be an instance of UCDStore");

log.info("Store basePath:", store.basePath);
assert(store.basePath === "/ucd-data", "store basePath should be set correctly");

// fs capabilities
assert(store.fs.capabilities != null, "store should have file system capabilities");
assert(store.fs.capabilities.read, "store should support reading files");
assert(store.fs.capabilities.write, "store should support writing files");
assert(store.fs.capabilities.listdir, "store should support listing directories");
assert(store.fs.capabilities.mkdir, "store should support creating directories");
assert(store.fs.capabilities.stat, "store should support file stats");
assert(store.fs.capabilities.exists, "store should support checking file existence");
assert(store.fs.capabilities.rm, "store should support removing files");

// capabilities
assert(store.capabilities != null, "store should have capabilities");
assert(store.capabilities.mirror, "store should support mirroring files");
assert(store.capabilities.analyze, "store should support analyzing files");
assert(store.capabilities.clean, "store should support cleaning files");
assert(store.capabilities.repair, "store should support repairing files");

log.info("All capability assertions passed");

// Test basic file operations with in-memory filesystem
try {
  const testFile = "/test-file.txt";
  await store.fs.write(testFile, "Hello, Memory UCD Store!");
  const content = await store.fs.read(testFile);
  assert(content === "Hello, Memory UCD Store!", "file content should match");
  log.info("Memory file write/read test passed");

  // Test directory operations
  await store.fs.mkdir("/test-dir");
  const exists = await store.fs.exists("/test-dir");
  assert(exists, "directory should exist");
  log.info("Memory directory creation test passed");

  // Test file stats
  const stats = await store.fs.stat(testFile);
  assert(stats.isFile(), "should be a file");
  assert(!stats.isDirectory(), "should not be a directory");
  assert(stats.size === "Hello, Memory UCD Store!".length, "size should match content length");
  log.info("Memory file stats test passed");

  // Clean up test files
  await store.fs.rm(testFile);
  await store.fs.rm("/test-dir");
  log.info("Memory test files cleaned up");

  // Verify cleanup
  const testFileExists = await store.fs.exists(testFile);
  const testDirExists = await store.fs.exists("/test-dir");
  assert(!testFileExists, "test file should be removed");
  assert(!testDirExists, "test directory should be removed");
  log.info("Memory cleanup verification passed");
} catch (error) {
  log.error("Memory file operation test failed:", error);
}

log.info("Memory playground completed successfully");
log.info("Memory filesystem entries:", Array.from(memoryFS.keys()));
