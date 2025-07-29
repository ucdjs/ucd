import type { Dirent } from "node:fs";
import type { FSEntry } from "../types";
import {
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import nodePath from "node:path";
import { invariant } from "@luxass/utils";
import { prependLeadingSlash, trimTrailingSlash } from "@luxass/utils/path";
import { z } from "zod";
import { defineFileSystemBridge } from "../define";

/**
 * List of dangerous system paths that should never be used as base paths.
 * These paths represent critical system directories that could cause severe
 * damage if modified or accessed inappropriately by the file system bridge.
 *
 * @internal
 */
const DANGEROUS_BASE_PATHS = ["/", "/usr", "/bin", "/sbin", "/etc", "/var", "/sys", "/proc"];

/**
 * Extended list of critical system paths that are protected from direct access.
 * This includes all dangerous base paths plus additional system directories
 * that should never be accessed through the file system bridge for security reasons.
 *
 * These paths represent:
 * - Root filesystem (`/`)
 * - System binaries (`/usr`, `/bin`, `/sbin`)
 * - Configuration files (`/etc`)
 * - System data (`/var`, `/sys`, `/proc`)
 * - Device files (`/dev`)
 * - Boot files (`/boot`)
 *
 * @internal
 * @see {@link DANGEROUS_BASE_PATHS} for base path validation
 */
const CRITICAL_SYSTEM_PATHS = ["/", "/usr", "/bin", "/sbin", "/etc", "/var", "/sys", "/proc", "/dev", "/boot"];

async function safeExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function normalizePath(basePath: string, requestPath: string): string {
  const resolvedBasePath = nodePath.resolve(basePath);
  const resolvedPath = nodePath.resolve(resolvedBasePath, requestPath);

  // ensure path stays within basePath
  invariant(
    resolvedPath.startsWith(resolvedBasePath + nodePath.sep) || resolvedPath === resolvedBasePath,
    `Path traversal detected: "${requestPath}" resolves to "${resolvedPath}" which is outside basePath "${resolvedBasePath}"`,
  );

  // prevent access to critical system paths
  invariant(
    !CRITICAL_SYSTEM_PATHS.includes(resolvedPath),
    `Critical system path access denied: "${resolvedPath}" is protected`,
  );

  return resolvedPath;
}

const NodeFileSystemBridge = defineFileSystemBridge({
  optionsSchema: z.object({
    basePath: z.string().refine((basePath) => !DANGEROUS_BASE_PATHS.includes(nodePath.resolve(basePath)), {
      message: "Base path cannot resolve to a dangerous system path",
      path: ["basePath"],
    }),
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
      async read(path) {
        return readFile(normalizePath(basePath, path), "utf-8");
      },
      async exists(path) {
        return safeExists(normalizePath(basePath, path));
      },
      async listdir(path, recursive = false) {
        const targetPath = normalizePath(basePath, path);

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
      async write(path, data, encoding = "utf-8") {
        const fullPath = normalizePath(basePath, path);
        const parentDir = nodePath.dirname(fullPath);

        if (!(await safeExists(parentDir))) {
          // create parent directories if they don't exist
          await mkdir(parentDir, { recursive: true });
        }

        return writeFile(fullPath, data, { encoding });
      },
      async mkdir(path) {
        // mkdir returns the first directory path, when recursive is true
        await mkdir(normalizePath(basePath, path), { recursive: true });
        return void 0;
      },
      async rm(path, options) {
        return rm(normalizePath(basePath, path), {
          recursive: options?.recursive ?? false,
          force: options?.force ?? false,
        });
      },
    };
  },
});

export default NodeFileSystemBridge;
