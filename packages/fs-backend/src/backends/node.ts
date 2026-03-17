import type { Dirent } from "node:fs";
import type { BackendEntry, BackendStat } from "../types";
import fsp from "node:fs/promises";
import nodePath from "node:path";
import { appendTrailingSlash, prependLeadingSlash } from "@luxass/utils/path";
import { createDebugger } from "@ucdjs-internal/shared";
import { assertNotUNCPath, resolveSafePath } from "@ucdjs/path-utils";
import { z } from "zod";
import { defineBackend } from "../define";

const debug = createDebugger("ucdjs:fs-backend:node");
const BACKSLASH_RE = /\\/g;

function normalizePathSeparators(path: string): string {
  return path.replace(BACKSLASH_RE, "/");
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

const NodeFileSystemBackend = defineBackend({
  meta: {
    name: "Node.js File System Backend",
    description: "A file system backend that uses Node.js fs module to interact with the local file system.",
  },
  optionsSchema: z.object({
    basePath: z.string(),
  }),
  setup(options) {
    assertNotUNCPath(options.basePath);

    const basePath = nodePath.resolve(options.basePath);

    function formatEntryPath(relativeToRoot: string, isDirectory: boolean): string {
      const withLeadingSlash = prependLeadingSlash(relativeToRoot);
      return isDirectory ? appendTrailingSlash(withLeadingSlash) : withLeadingSlash;
    }

    function createBackendEntry(entry: Dirent, relativeToRoot: string): BackendEntry {
      const formattedPath = formatEntryPath(relativeToRoot, entry.isDirectory());

      return entry.isDirectory()
        ? { type: "directory", name: entry.name, path: formattedPath, children: [] }
        : { type: "file", name: entry.name, path: formattedPath };
    }

    return {
      async read(path) {
        const trimmedPath = path.trim();
        if (trimmedPath.endsWith("/") && trimmedPath !== "/" && trimmedPath !== "./" && trimmedPath !== "../") {
          throw new Error("Cannot read file: path ends with '/'");
        }

        return fsp.readFile(resolveSafePath(basePath, path), "utf-8");
      },
      async readBytes(path) {
        const trimmedPath = path.trim();
        if (trimmedPath.endsWith("/") && trimmedPath !== "/" && trimmedPath !== "./" && trimmedPath !== "../") {
          throw new Error("Cannot read file: path ends with '/'");
        }

        return fsp.readFile(resolveSafePath(basePath, path));
      },
      async list(path, options) {
        const recursive = options?.recursive ?? false;
        const targetPath = resolveSafePath(basePath, path);

        if (!recursive) {
          const entries = await fsp.readdir(targetPath, { withFileTypes: true });
          return entries.map((entry) => {
            const absEntryPath = nodePath.join(targetPath, entry.name);
            const relToBase = nodePath.relative(basePath, absEntryPath);
            return createBackendEntry(entry, normalizePathSeparators(relToBase));
          });
        }

        const allEntries = await fsp.readdir(targetPath, { withFileTypes: true, recursive: true });

        const entryMap = new Map<string, BackendEntry>();
        const rootEntries: BackendEntry[] = [];

        for (const entry of allEntries) {
          const entryDirPath = entry.parentPath || entry.path;
          const relativeToTargetDir = nodePath.relative(targetPath, entryDirPath);
          const absEntryPath = nodePath.join(entryDirPath, entry.name);
          const relToBase = nodePath.relative(basePath, absEntryPath);
          const normalized = normalizePathSeparators(relToBase);

          const backendEntry = createBackendEntry(entry, normalized);

          entryMap.set(normalized, backendEntry);

          if (!relativeToTargetDir) {
            rootEntries.push(backendEntry);
          }
        }

        for (const [entryPath, entry] of entryMap) {
          const parentPath = nodePath.dirname(entryPath);
          if (parentPath && parentPath !== ".") {
            const parent = entryMap.get(parentPath);
            if (parent?.type === "directory") {
              parent.children.push(entry);
            }
          }
        }

        return rootEntries;
      },
      async exists(path) {
        return safeExists(resolveSafePath(basePath, path));
      },
      async stat(path) {
        const stats = await fsp.stat(resolveSafePath(basePath, path));

        const stat: BackendStat = {
          type: stats.isDirectory() ? "directory" : "file",
          size: stats.size,
          mtime: stats.mtime,
        };

        return stat;
      },
      async write(path, data) {
        const trimmedPath = path.trim();
        if (trimmedPath.endsWith("/") && trimmedPath !== "/" && trimmedPath !== "./" && trimmedPath !== "../") {
          throw new Error("Cannot write file: path ends with '/'");
        }

        const resolvedPath = resolveSafePath(basePath, path);
        const parentDir = nodePath.dirname(resolvedPath);

        if (!(await safeExists(parentDir))) {
          await fsp.mkdir(parentDir, { recursive: true });
        }

        await fsp.writeFile(resolvedPath, data);
      },
      async mkdir(path) {
        await fsp.mkdir(resolveSafePath(basePath, path), { recursive: true });
      },
      async remove(path, options) {
        await fsp.rm(resolveSafePath(basePath, path), {
          recursive: options?.recursive ?? false,
          force: options?.force ?? false,
        });
      },
      async copy(sourcePath, destinationPath, options) {
        const resolvedSourcePath = resolveSafePath(basePath, sourcePath);
        const resolvedDestinationPath = resolveSafePath(basePath, destinationPath);
        const destinationParentDir = nodePath.dirname(resolvedDestinationPath);

        if (!(await safeExists(destinationParentDir))) {
          await fsp.mkdir(destinationParentDir, { recursive: true });
        }

        await fsp.cp(resolvedSourcePath, resolvedDestinationPath, {
          recursive: options?.recursive ?? false,
          force: options?.overwrite ?? true,
          errorOnExist: options?.overwrite === false,
        });
      },
    };
  },
});

export default NodeFileSystemBackend;
