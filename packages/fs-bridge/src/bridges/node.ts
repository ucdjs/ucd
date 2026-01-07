import type { Dirent } from "node:fs";
import type { FSEntry } from "../types";
import fsp from "node:fs/promises";
import nodePath from "node:path";
import { appendTrailingSlash, prependLeadingSlash } from "@luxass/utils/path";
import { createDebugger } from "@ucdjs-internal/shared";
import { assertNotUNCPath } from "@ucdjs/path-utils";
import { z } from "zod";
import { defineFileSystemBridge } from "../define";

const debug = createDebugger("ucdjs:fs-bridge:node");

/**
 * Normalizes path separators to forward slashes for cross-platform consistency.
 * On Windows, converts backslashes to forward slashes.
 */
function normalizePathSeparators(path: string): string {
  return path.replace(/\\/g, "/");
}

async function safeExists(path: string): Promise<boolean> {
  try {
    await fsp.stat(path);
    return true;
  } catch {
    debug?.("File existence check failed", { path });
    return false;
  }
}

const NodeFileSystemBridge = defineFileSystemBridge({
  meta: {
    name: "Node.js File System Bridge",
    description: "A file system bridge that uses Node.js fs module to interact with the local file system.",
  },
  optionsSchema: z.object({
    basePath: z.string(),
  }),
  setup({ options, resolveSafePath }) {
    // Validate UNC paths before resolving
    assertNotUNCPath(options.basePath);

    const basePath = nodePath.resolve(options.basePath);

    return {
      async read(path) {
        // TODO: duplicate code with write - refactor
        // Reject file paths ending with / - files don't have trailing slashes
        // Allow /, ./, and ../ as they are special directory references
        const trimmedPath = path.trim();
        if (trimmedPath.endsWith("/") && trimmedPath !== "/" && trimmedPath !== "./" && trimmedPath !== "../") {
          throw new Error("Cannot read file: path ends with '/'");
        }

        const resolvedPath = resolveSafePath(basePath, path);
        return fsp.readFile(resolvedPath, "utf-8");
      },
      async exists(path) {
        return safeExists(resolveSafePath(basePath, path));
      },
      /**
       * Lists directory contents at the given path.
       *
       * PARITY NOTE: Unlike the HTTP bridge, the Node bridge does not use Zod schema
       * validation for listdir output. This is intentional because:
       * - Node bridge constructs FSEntry objects locally from trusted fs.Dirent data
       * - HTTP bridge must validate untrusted JSON responses from remote API
       *
       * However, the output shape MUST remain consistent with the FSEntry contract:
       * - Files: { type: "file", name: string, path: string }
       * - Directories: { type: "directory", name: string, path: string, children: FSEntry[] }
       *
       * Tests in test/bridges/node/node.test.ts verify this shape consistency.
       */
      async listdir(path, recursive = false) {
        const targetPath = resolveSafePath(basePath, path);

        /**
         * Formats a relative path to match FileEntry schema requirements:
         * - Leading slash required for all paths
         * - Trailing slash required for directories
         */
        function formatEntryPath(relativePath: string, isDirectory: boolean): string {
          const withLeadingSlash = prependLeadingSlash(relativePath);
          return isDirectory ? appendTrailingSlash(withLeadingSlash) : withLeadingSlash;
        }

        function createFSEntry(entry: Dirent, relativePath?: string): FSEntry {
          const pathBase = relativePath ?? entry.name;
          const formattedPath = formatEntryPath(pathBase, entry.isDirectory());
          return entry.isDirectory()
            ? {
                type: "directory",
                name: entry.name,
                path: formattedPath,
                children: [],
              }
            : {
                type: "file",
                name: entry.name,
                path: formattedPath,
              };
        }

        if (!recursive) {
          const entries = await fsp.readdir(targetPath, { withFileTypes: true });
          return entries.map((entry) => createFSEntry(entry));
        }

        const allEntries = await fsp.readdir(targetPath, {
          withFileTypes: true,
          recursive: true,
        });

        const entryMap = new Map<string, FSEntry>();
        const rootEntries: FSEntry[] = [];

        for (const entry of allEntries) {
          const entryPath = entry.parentPath || entry.path;
          const relativeToTarget = nodePath.relative(targetPath, entryPath);

          const entryRelativePath = relativeToTarget
            ? nodePath.join(relativeToTarget, entry.name)
            : entry.name;

          // Normalize path separators to forward slashes for cross-platform consistency
          const normalizedPath = normalizePathSeparators(entryRelativePath);

          // Create FSEntry with properly formatted path (leading /, trailing / for dirs)
          const fsEntry = createFSEntry(entry, normalizedPath);

          // Use normalized path (without leading/trailing slashes) as map key for parent lookup
          entryMap.set(normalizedPath, fsEntry);

          if (!relativeToTarget) {
            rootEntries.push(fsEntry);
          }
        }

        for (const [entryPath, entry] of entryMap) {
          const parentPath = nodePath.dirname(entryPath);
          if (parentPath && parentPath !== ".") {
            const parent = entryMap.get(parentPath);
            if (parent?.type === "directory") {
              parent.children!.push(entry);
            }
          }
        }

        return rootEntries;
      },
      async write(path, data, encoding = "utf-8") {
        // Reject file paths ending with / - files don't have trailing slashes
        // Allow /, ./, and ../ as they are special directory references
        const trimmedPath = path.trim();
        if (trimmedPath.endsWith("/") && trimmedPath !== "/" && trimmedPath !== "./" && trimmedPath !== "../") {
          throw new Error("Cannot write file: path ends with '/'");
        }

        const resolvedPath = resolveSafePath(basePath, path);
        const parentDir = nodePath.dirname(resolvedPath);

        if (!(await safeExists(parentDir))) {
          // create parent directories if they don't exist
          await fsp.mkdir(parentDir, { recursive: true });
        }

        return fsp.writeFile(resolvedPath, data, { encoding });
      },
      async mkdir(path) {
        // mkdir returns the first directory path, when recursive is true
        await fsp.mkdir(resolveSafePath(basePath, path), { recursive: true });
        return void 0;
      },
      async rm(path, options) {
        return fsp.rm(resolveSafePath(basePath, path), {
          recursive: options?.recursive ?? false,
          force: options?.force ?? false,
        });
      },
    };
  },
});

export default NodeFileSystemBridge;
