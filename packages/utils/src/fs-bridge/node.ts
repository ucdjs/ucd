import type { Dirent } from "node:fs";
import type { FSEntry } from "../fs-bridge";
import {
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { prependLeadingSlash, trimTrailingSlash } from "@luxass/utils";
import z from "zod";
import { defineFileSystemBridge } from "../fs-bridge";

async function safeExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

const NodeFileSystemBridge = defineFileSystemBridge({
  optionsSchema: z.object({
    basePath: z.string(),
  }),
  capabilities: {
    exists: true,
    read: true,
    write: true,
    listdir: true,
    mkdir: true,
    rm: true,
  },
  setup({ options }) {
    const basePath = options.basePath;
    return {
      read(path) {
        return readFile(join(basePath, path), "utf-8");
      },
      exists(path) {
        return safeExists(join(basePath, path));
      },
      async listdir(path, recursive = false) {
        const targetPath = join(basePath, path);

        function createFSEntry(entry: Dirent): FSEntry {
          const pathFromName = prependLeadingSlash(trimTrailingSlash(entry.name));
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
          const entries = await readdir(targetPath, { withFileTypes: true });
          return entries.map((entry) => createFSEntry(entry));
        }

        const allEntries = await readdir(targetPath, {
          withFileTypes: true,
          recursive: true,
        });

        const entryMap = new Map<string, FSEntry>();
        const rootEntries: FSEntry[] = [];

        for (const entry of allEntries) {
          const entryPath = entry.parentPath || entry.path;
          const relativeToTarget = relative(targetPath, entryPath);
          const fsEntry = createFSEntry(entry);

          const entryRelativePath = relativeToTarget
            ? join(relativeToTarget, entry.name)
            : entry.name;

          entryMap.set(entryRelativePath, fsEntry);

          if (!relativeToTarget) {
            rootEntries.push(fsEntry);
          }
        }

        for (const [entryPath, entry] of entryMap) {
          const parentPath = dirname(entryPath);
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
        const fullPath = join(basePath, path);
        const parentDir = dirname(fullPath);

        if (!(await safeExists(parentDir))) {
          // create parent directories if they don't exist
          await mkdir(parentDir, { recursive: true });
        }

        return writeFile(fullPath, data, { encoding });
      },
      async mkdir(path) {
        // mkdir returns the first directory path, when recursive is true
        await mkdir(join(basePath, path), { recursive: true });
        return void 0;
      },
      async rm(path, options) {
        return rm(join(basePath, path), {
          recursive: options?.recursive ?? false,
          force: options?.force ?? false,
        });
      },
    };
  },
});

export default NodeFileSystemBridge;
