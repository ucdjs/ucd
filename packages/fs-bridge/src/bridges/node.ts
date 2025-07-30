import type { Dirent } from "node:fs";
import type { FSEntry } from "../types";
import fsp from "node:fs/promises";
import nodePath from "node:path";
import { prependLeadingSlash, trimTrailingSlash } from "@luxass/utils/path";
import { z } from "zod";
import { defineFileSystemBridge } from "../define";

async function safeExists(path: string): Promise<boolean> {
  try {
    await fsp.stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely resolves a user-provided path relative to a base directory while preventing path traversal attacks.
 *
 * This function performs multiple security checks:
 * - Detects dangerous control characters (null bytes, newlines, carriage returns)
 * - URL-decodes the input path to catch encoded traversal attempts
 * - Normalizes and resolves paths to prevent directory traversal
 * - Validates that the final resolved path stays within the base directory
 *
 * @param {string} basePath - The base directory that should contain the resolved path
 * @param {string} inputPath - The user-provided path to resolve (can be relative or absolute)
 * @returns {string} The safely resolved absolute path within the base directory
 * @throws {Error} When path traversal is detected or the resolved path would escape the base directory
 *
 * @remarks
 * - Absolute input paths are treated as relative to the base directory
 * - URL-encoded characters are decoded once to detect encoded traversal attempts
 * - The function handles both Unix and Windows path separators correctly
 */
export function resolveSafePath(basePath: string, inputPath: string): string {
  // fast check for dangerous control characters
  if (/[\0\n\r]/.test(inputPath)) {
    throw new Error(`Path contains dangerous control characters: ${inputPath}`);
  }

  // decode URL-encoded characters once to detect encoded traversal attempts
  let decodedPath = inputPath;
  if (inputPath.includes("%")) {
    try {
      decodedPath = decodeURIComponent(inputPath);
    } catch {
      throw new Error(`Invalid URL encoding in path: ${inputPath}`);
    }
  }

  const resolvedBasePath = nodePath.resolve(basePath);

  // handle absolute paths
  let cleanPath: string;
  if (nodePath.isAbsolute(decodedPath)) {
    // if the absolute path is already within the base path, use the relative portion
    const resolvedInputPath = nodePath.resolve(decodedPath);
    if (resolvedInputPath.startsWith(resolvedBasePath + nodePath.sep) || resolvedInputPath === resolvedBasePath) {
      cleanPath = nodePath.relative(resolvedBasePath, resolvedInputPath);
    } else {
      // treat absolute paths as relative to base (remove leading slash)
      cleanPath = nodePath.normalize(decodedPath.slice(1));
    }
  } else {
    cleanPath = nodePath.normalize(decodedPath);
  }

  const resolvedPath = nodePath.resolve(resolvedBasePath, cleanPath);

  // check if resolved path is within the base directory
  if (!isWithinBase(resolvedPath, resolvedBasePath)) {
    throw new Error(`Path traversal detected: ${inputPath} resolves outside base directory`);
  }

  return resolvedPath;
}

/**
 * Checks if a resolved path is within the specified base directory.
 * This function is used for security validation to prevent path traversal attacks.
 *
 * @param {string} resolvedPath - The fully resolved absolute path to validate
 * @param {string} basePath - The base directory path that should contain the resolved path
 * @returns {boolean} `true` if the resolved path is within the base directory, `false` otherwise
 *
 * @remarks
 * - For root base path ("/"), any absolute path is considered valid
 * - For non-root base paths, the resolved path must either equal the base path
 *   or start with the base path followed by a path separator
 */
function isWithinBase(resolvedPath: string, basePath: string): boolean {
  // handle root base path case
  if (basePath === "/") {
    return resolvedPath === "/" || resolvedPath.startsWith("/");
  }

  // for non-root base paths, check if resolved path starts with base + separator or equals base
  return resolvedPath.startsWith(basePath + nodePath.sep) || resolvedPath === basePath;
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
    const basePath = nodePath.resolve(options.basePath);

    return {
      async read(path) {
        const resolvedPath = resolveSafePath(basePath, path);
        return fsp.readFile(resolvedPath, "utf-8");
      },
      async exists(path) {
        return safeExists(resolveSafePath(basePath, path));
      },
      async listdir(path, recursive = false) {
        const targetPath = resolveSafePath(basePath, path);

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
      async write(path, data, encoding = "utf-8") {
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
