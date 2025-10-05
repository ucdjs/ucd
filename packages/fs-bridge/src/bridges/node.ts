import type { Dirent } from "node:fs";
import type { FSEntry } from "../types";
import fsp from "node:fs/promises";
import nodePath from "node:path";
import { trimTrailingSlash } from "@luxass/utils/path";
import { createDebugger } from "@ucdjs/shared";
import { z } from "zod";
import { defineFileSystemBridge } from "../define";

const debug = createDebugger("ucdjs:fs-bridge:node");

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
  setup({ resolveSafePath }) {
    return {
      async read(basePath, path) {
        const resolvedPath = resolveSafePath(basePath, path);
        return fsp.readFile(resolvedPath, "utf-8");
      },
      async exists(basePath, path) {
        return safeExists(resolveSafePath(basePath, path));
      },
      async listdir(basePath, path, recursive = false) {
        const targetPath = resolveSafePath(basePath, path);

        function createFSEntry(entry: Dirent): FSEntry {
          const pathFromName = trimTrailingSlash(entry.name);
          return entry.isDirectory()
            ? {
                type: "directory",
                name: entry.name,
                path: pathFromName,
                children: [],
              }
            : {
                type: "file",
                name: entry.name,
                path: pathFromName,
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
          const fsEntry = createFSEntry(entry);

          const entryRelativePath = relativeToTarget
            ? nodePath.join(relativeToTarget, entry.name)
            : entry.name;

          entryMap.set(entryRelativePath, fsEntry);

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
      async write(basePath, path, data, encoding = "utf-8") {
        const resolvedPath = resolveSafePath(basePath, path);
        const parentDir = nodePath.dirname(resolvedPath);

        if (!(await safeExists(parentDir))) {
          // create parent directories if they don't exist
          await fsp.mkdir(parentDir, { recursive: true });
        }

        return fsp.writeFile(resolvedPath, data, { encoding });
      },
      async mkdir(basePath, path) {
        // mkdir returns the first directory path, when recursive is true
        await fsp.mkdir(resolveSafePath(basePath, path), { recursive: true });
        return void 0;
      },
      async rm(basePath, path, options) {
        return fsp.rm(resolveSafePath(basePath, path), {
          recursive: options?.recursive ?? false,
          force: options?.force ?? false,
        });
      },
    };
  },
});

export default NodeFileSystemBridge;
