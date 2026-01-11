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

        function formatEntryPath(relativeToRoot: string, isDirectory: boolean): string {
          const withLeadingSlash = prependLeadingSlash(relativeToRoot);
          return isDirectory ? appendTrailingSlash(withLeadingSlash) : withLeadingSlash;
        }

        function createFSEntry(entry: Dirent, relativeToRoot: string): FSEntry {
          const formattedPath = formatEntryPath(relativeToRoot, entry.isDirectory());
          return entry.isDirectory()
            ? { type: "directory", name: entry.name, path: formattedPath, children: [] }
            : { type: "file", name: entry.name, path: formattedPath };
        }

        if (!recursive) {
          const entries = await fsp.readdir(targetPath, { withFileTypes: true });
          return entries.map((entry) => {
            const absEntryPath = nodePath.join(targetPath, entry.name);
            const relToBase = nodePath.relative(basePath, absEntryPath);
            const normalized = normalizePathSeparators(relToBase);
            return createFSEntry(entry, normalized);
          });
        }

        const allEntries = await fsp.readdir(targetPath, { withFileTypes: true, recursive: true });

        const entryMap = new Map<string, FSEntry>();
        const rootEntries: FSEntry[] = [];

        for (const entry of allEntries) {
          const entryDirPath = entry.parentPath || entry.path; // directory containing the entry (OS path)
          const relativeToTargetDir = nodePath.relative(targetPath, entryDirPath);

          const absEntryPath = nodePath.join(entryDirPath, entry.name);
          const relToBase = nodePath.relative(basePath, absEntryPath);
          const normalized = normalizePathSeparators(relToBase);

          const fsEntry = createFSEntry(entry, normalized);

          entryMap.set(normalized, fsEntry);

          // Root entries are direct children of the requested directory
          if (!relativeToTargetDir) {
            rootEntries.push(fsEntry);
          }
        }

        for (const [entryPath, entry] of entryMap) {
          const parentPath = nodePath.dirname(entryPath);
          if (parentPath && parentPath !== ".") {
            const parent = entryMap.get(parentPath);
            if (parent?.type === "directory") parent.children!.push(entry);
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
