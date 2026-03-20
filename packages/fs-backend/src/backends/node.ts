import type { Dirent } from "node:fs";
import type { BackendEntry, BackendStat } from "../types";
import fsp from "node:fs/promises";
import nodePath from "node:path";
import { createDebugger } from "@ucdjs-internal/shared";
import { assertNotUNCPath, PathTraversalError, resolveSafePath } from "@ucdjs/path-utils";
import { z } from "zod";
import { defineBackend } from "../define";
import {
  BackendEntryIsDirectory,
  BackendEntryIsFile,
  BackendFileNotFound,
  CopyDestinationAlreadyExistsError,
} from "../errors";
import {
  assertFilePath,
  isDirectoryPath,
  normalizeEntryPath,
  normalizePathSeparators,
  sortEntries,
} from "../utils";

const debug = createDebugger("ucdjs:fs-backend:node");

function isNodeErrorWithCode(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === code;
}

function normalizeReadError(path: string, error: unknown): never {
  if (isNodeErrorWithCode(error, "ENOENT")) {
    throw new BackendFileNotFound(path);
  }

  if (isNodeErrorWithCode(error, "EISDIR")) {
    throw new BackendEntryIsDirectory(path);
  }

  throw error;
}

function normalizeListError(path: string, error: unknown): never {
  if (isNodeErrorWithCode(error, "ENOENT")) {
    throw new BackendFileNotFound(path);
  }

  if (isNodeErrorWithCode(error, "ENOTDIR")) {
    throw new BackendEntryIsFile(path);
  }

  throw error;
}

function normalizeRemoveError(path: string, error: unknown): never {
  if (isNodeErrorWithCode(error, "ENOENT")) {
    throw new BackendFileNotFound(path);
  }

  throw error;
}

async function safeStat(path: string): Promise<Awaited<ReturnType<typeof fsp.stat>> | null> {
  try {
    return await fsp.stat(path);
  } catch (error) {
    if (isNodeErrorWithCode(error, "ENOENT")) {
      return null;
    }

    throw error;
  }
}

async function safeLstat(path: string): Promise<Awaited<ReturnType<typeof fsp.lstat>> | null> {
  try {
    return await fsp.lstat(path);
  } catch (error) {
    if (isNodeErrorWithCode(error, "ENOENT")) {
      return null;
    }

    throw error;
  }
}

async function safeRealpath(path: string): Promise<string | null> {
  try {
    return await fsp.realpath(path);
  } catch (error) {
    if (isNodeErrorWithCode(error, "ENOENT")) {
      return null;
    }

    throw error;
  }
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

function isWithinRealSandbox(baseRealPath: string, candidateRealPath: string): boolean {
  const relative = nodePath.relative(baseRealPath, candidateRealPath);
  return relative === "" || (!relative.startsWith("..") && !nodePath.isAbsolute(relative));
}

async function assertWithinRealSandbox(basePath: string, resolvedPath: string): Promise<void> {
  const baseRealPath = await safeRealpath(basePath) ?? basePath;
  const relativeToBase = nodePath.relative(basePath, resolvedPath);

  if (!relativeToBase || relativeToBase === ".") {
    return;
  }

  let currentPath = basePath;
  for (const segment of relativeToBase.split(nodePath.sep).filter(Boolean)) {
    currentPath = nodePath.join(currentPath, segment);

    const stats = await safeLstat(currentPath);
    if (stats == null) {
      return;
    }

    if (!stats.isSymbolicLink()) {
      continue;
    }

    const realCurrentPath = await fsp.realpath(currentPath);
    if (!isWithinRealSandbox(baseRealPath, realCurrentPath)) {
      throw new PathTraversalError(basePath, resolvedPath);
    }
  }

  const realResolvedPath = await safeRealpath(resolvedPath);
  if (realResolvedPath != null && !isWithinRealSandbox(baseRealPath, realResolvedPath)) {
    throw new PathTraversalError(basePath, resolvedPath);
  }
}

async function resolveSandboxedPath(basePath: string, inputPath: string): Promise<string> {
  const resolvedPath = resolveSafePath(basePath, inputPath);
  await assertWithinRealSandbox(basePath, resolvedPath);
  return resolvedPath;
}

const NodeFileSystemBackend = defineBackend({
  meta: {
    name: "Node.js File System Backend",
    description: "A file system backend that uses Node.js fs module to interact with the local file system.",
  },
  optionsSchema: z.object({
    basePath: z.string().trim().min(1, "basePath is required"),
  }),
  setup(options) {
    assertNotUNCPath(options.basePath);

    const basePath = nodePath.resolve(options.basePath);

    function createBackendEntry(entry: Dirent, relativeToRoot: string): BackendEntry {
      return entry.isDirectory()
        ? { type: "directory", name: entry.name, path: normalizeEntryPath(relativeToRoot, "directory"), children: [] }
        : { type: "file", name: entry.name, path: normalizeEntryPath(relativeToRoot, "file") };
    }

    return {
      async read(path) {
        assertFilePath(path);

        return fsp.readFile(await resolveSandboxedPath(basePath, path), "utf-8")
          .catch((error: unknown) => normalizeReadError(path, error));
      },
      async readBytes(path) {
        assertFilePath(path);

        return fsp.readFile(await resolveSandboxedPath(basePath, path))
          .then((data) => new Uint8Array(data))
          .catch((error: unknown) => normalizeReadError(path, error));
      },
      async list(path, options) {
        const recursive = options?.recursive ?? false;
        const targetPath = await resolveSandboxedPath(basePath, path);

        if (!recursive) {
          const entries = await fsp.readdir(targetPath, { withFileTypes: true })
            .catch((error: unknown) => normalizeListError(path, error));
          return sortEntries(entries.map((entry) => {
            const absEntryPath = nodePath.join(targetPath, entry.name);
            const relToBase = nodePath.relative(basePath, absEntryPath);
            return createBackendEntry(entry, normalizePathSeparators(relToBase));
          }));
        }

        const allEntries = await fsp.readdir(targetPath, { withFileTypes: true, recursive: true })
          .catch((error: unknown) => normalizeListError(path, error));

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

        return sortEntries(rootEntries);
      },
      async exists(path) {
        return safeExists(await resolveSandboxedPath(basePath, path));
      },
      async stat(path) {
        const stats = await fsp.stat(await resolveSandboxedPath(basePath, path))
          .catch((error: unknown) => {
            if (isNodeErrorWithCode(error, "ENOENT")) {
              throw new BackendFileNotFound(path);
            }

            throw error;
          });

        const stat: BackendStat = {
          type: stats.isDirectory() ? "directory" : "file",
          size: stats.size,
          mtime: stats.mtime,
        };

        return stat;
      },
      async write(path, data) {
        assertFilePath(path);

        const resolvedPath = await resolveSandboxedPath(basePath, path);
        const parentDir = nodePath.dirname(resolvedPath);

        if (!(await safeExists(parentDir))) {
          await fsp.mkdir(parentDir, { recursive: true });
        }

        await fsp.writeFile(resolvedPath, data);
      },
      async mkdir(path) {
        await fsp.mkdir(await resolveSandboxedPath(basePath, path), { recursive: true });
      },
      async remove(path, options) {
        await fsp.rm(await resolveSandboxedPath(basePath, path), {
          recursive: options?.recursive ?? false,
          force: options?.force ?? false,
        }).catch((error: unknown) => normalizeRemoveError(path, error));
      },
      async copy(sourcePath, destinationPath, options) {
        const resolvedSourcePath = await resolveSandboxedPath(basePath, sourcePath);
        const resolvedDestinationPath = await resolveSandboxedPath(basePath, destinationPath);
        const sourceStats = await safeStat(resolvedSourcePath);

        if (sourceStats == null) {
          throw new BackendFileNotFound(sourcePath);
        }

        const destinationStats = await safeStat(resolvedDestinationPath);
        const destinationActsAsDirectory = isDirectoryPath(destinationPath)
          || destinationStats?.isDirectory() === true;

        if (sourceStats.isDirectory() && options?.recursive !== true) {
          throw new BackendEntryIsDirectory(sourcePath);
        }

        const resolvedCopyDestinationPath = !sourceStats.isDirectory() && destinationActsAsDirectory
          ? nodePath.join(resolvedDestinationPath, nodePath.basename(resolvedSourcePath))
          : resolvedDestinationPath;
        const copyDestinationPath = normalizeEntryPath(
          normalizePathSeparators(nodePath.relative(basePath, resolvedCopyDestinationPath)),
          sourceStats.isDirectory() ? "directory" : "file",
        );
        const copyDestinationStats = await safeStat(resolvedCopyDestinationPath);

        if (options?.overwrite === false && copyDestinationStats != null) {
          throw new CopyDestinationAlreadyExistsError(copyDestinationPath);
        }

        const destinationParentDir = nodePath.dirname(resolvedCopyDestinationPath);

        if (!(await safeExists(destinationParentDir))) {
          await fsp.mkdir(destinationParentDir, { recursive: true });
        }

        await fsp.cp(resolvedSourcePath, resolvedCopyDestinationPath, {
          recursive: sourceStats.isDirectory(),
          force: options?.overwrite ?? true,
          errorOnExist: options?.overwrite === false,
        });
      },
    };
  },
});

export default NodeFileSystemBackend;
