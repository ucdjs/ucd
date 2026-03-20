import type {
  BackendEntry,
  BackendStat,
  CopyOptions,
  ListOptions,
  RemoveOptions,
} from "@ucdjs/fs-backend";
import nodePath from "node:path/posix";
import {
  BackendEntryIsDirectory,
  BackendEntryIsFile,
  BackendFileNotFound,
  CopyDestinationAlreadyExistsError,
  defineBackend,
} from "@ucdjs/fs-backend";
import {
  assertFilePath,
  isDirectoryPath,
  normalizeEntryPath,
  sortEntries,
} from "@ucdjs/fs-backend/utils";
import { resolveSafePath } from "@ucdjs/path-utils";
import { BackendEntryListSchema } from "@ucdjs/schemas";
import { z } from "zod";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const DIR_MARKER = Symbol("directory");
const LEADING_SLASH_RE = /^\/+/;
const TRAILING_SLASH_RE = /\/+$/;

type StoredValue = string | Uint8Array | typeof DIR_MARKER;

function normalizeRootPath(path: string | undefined): string {
  return (!path || path === "." || path === "/") ? "" : path;
}

function getDirMarkerKey(path: string): string {
  const normalized = normalizeRootPath(path);
  if (normalized === "") {
    return "";
  }

  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

function isDirMarkerKey(path: string): boolean {
  return path.endsWith("/");
}

function byteLength(value: StoredValue): number {
  if (value === DIR_MARKER) {
    return 0;
  }

  return typeof value === "string"
    ? textEncoder.encode(value).length
    : value.byteLength;
}

function cloneValue(value: StoredValue): StoredValue {
  if (value === DIR_MARKER || typeof value === "string") {
    return value;
  }

  return new Uint8Array(value);
}

function createMemoryEntry(path: string, type: BackendEntry["type"]): BackendEntry {
  const normalizedPath = normalizeEntryPath(path, type);
  const segments = normalizedPath === "/"
    ? ["/"]
    : normalizedPath.split("/").filter(Boolean);
  const name = normalizedPath === "/"
    ? "/"
    : segments.at(-1) ?? "";

  return type === "directory"
    ? {
        type,
        name,
        path: normalizedPath,
        children: [],
      }
    : {
        type,
        name,
        path: normalizedPath,
      };
}

function hasChildEntries(files: Map<string, StoredValue>, path: string): boolean {
  const normalizedPath = normalizeRootPath(path);
  const pathPrefix = normalizedPath === "" ? "" : getDirMarkerKey(normalizedPath);

  for (const filePath of files.keys()) {
    if (filePath.startsWith(pathPrefix)) {
      return true;
    }
  }

  return false;
}

export const createMemoryMockFS = defineBackend({
  meta: {
    name: "In-Memory File System Backend",
    description: "A simple in-memory backend using a flat Map for testing.",
  },
  optionsSchema: z.object({
    basePath: z.string().optional(),
    initialFiles: z.record(z.string(), z.union([z.string(), z.instanceof(Uint8Array)])).optional(),
    functions: z.object({
      read: z.function({
        input: [z.string()],
        output: z.promise(z.string()),
      }).optional(),
      readBytes: z.function({
        input: [z.string()],
        output: z.promise(z.instanceof(Uint8Array)),
      }).optional(),
      exists: z.function({
        input: [z.string()],
        output: z.promise(z.boolean()),
      }).optional(),
      stat: z.function({
        input: [z.string()],
        output: z.promise(z.object({
          type: z.enum(["file", "directory"]),
          size: z.number(),
          mtime: z.date().optional(),
        })),
      }).optional(),
      list: z.function({
        input: [z.string(), z.object({ recursive: z.boolean().optional() }).optional()],
        output: z.promise(BackendEntryListSchema),
      }).optional(),
      write: z.xor([
        z.function({
          input: [z.string(), z.xor([z.string(), z.instanceof(Uint8Array)])],
          output: z.promise(z.void()),
        }),
        z.literal(false),
      ]).optional(),
      mkdir: z.xor([
        z.function({
          input: [z.string()],
          output: z.promise(z.void()),
        }),
        z.literal(false),
      ]).optional(),
      remove: z.xor([
        z.function({
          input: [z.string(), z.object({ recursive: z.boolean().optional(), force: z.boolean().optional() }).optional()],
          output: z.promise(z.void()),
        }),
        z.literal(false),
      ]).optional(),
      copy: z.xor([
        z.function({
          input: [
            z.string(),
            z.string(),
            z.object({ recursive: z.boolean().optional(), overwrite: z.boolean().optional() }).optional(),
          ],
          output: z.promise(z.void()),
        }),
        z.literal(false),
      ]).optional(),
    }).partial().optional(),
  }).optional(),
  setup(options) {
    const basePath = options?.basePath ?? "/";
    const files = new Map<string, StoredValue>();

    const resolve = (path: string): string => resolveSafePath(basePath, path);
    const resolveFile = (path: string): string => {
      assertFilePath(path);
      return resolve(path);
    };
    const resolveDirectory = (path: string): string => {
      const resolvedPath = resolve(path);
      const normalizedPath = normalizeRootPath(resolvedPath);
      return normalizedPath === "" ? "" : getDirMarkerKey(normalizedPath);
    };

    const ensureParentDirectories = (path: string): void => {
      const parent = normalizeRootPath(nodePath.dirname(path));
      if (parent === "") {
        return;
      }

      const segments = parent.split("/").filter(Boolean);
      for (let index = 0; index < segments.length; index++) {
        const directoryPath = segments.slice(0, index + 1).join("/");
        files.set(getDirMarkerKey(directoryPath), DIR_MARKER);
      }
    };

    const getFileValue = (path: string): StoredValue | undefined => {
      const resolvedPath = resolveFile(path);
      return files.get(resolvedPath);
    };

    const getDirectoryKeyIfExists = (path: string): string | undefined => {
      const resolvedDirPath = resolveDirectory(path);

      if (resolvedDirPath === "") {
        return "";
      }

      if (files.has(resolvedDirPath) || hasChildEntries(files, resolvedDirPath)) {
        return resolvedDirPath;
      }

      return undefined;
    };

    if (options?.initialFiles) {
      for (const [path, value] of Object.entries(options.initialFiles) as Array<[string, StoredValue]>) {
        if (isDirectoryPath(path)) {
          const directoryPath = resolveDirectory(path);
          if (directoryPath !== "") {
            ensureParentDirectories(directoryPath);
            files.set(directoryPath, DIR_MARKER);
          }
          continue;
        }

        const resolvedPath = resolve(path);
        ensureParentDirectories(resolvedPath);
        files.set(resolvedPath, cloneValue(value));
      }
    }

    const operations = {
      async read(path: string): Promise<string> {
        const value = getFileValue(path);

        if (value === DIR_MARKER) {
          throw new BackendEntryIsDirectory(path);
        }

        if (value == null) {
          if (getDirectoryKeyIfExists(path) != null) {
            throw new BackendEntryIsDirectory(path);
          }

          throw new BackendFileNotFound(path);
        }

        return typeof value === "string"
          ? value
          : textDecoder.decode(value);
      },
      async readBytes(path: string): Promise<Uint8Array> {
        const value = getFileValue(path);

        if (value === DIR_MARKER) {
          throw new BackendEntryIsDirectory(path);
        }

        if (value == null) {
          if (getDirectoryKeyIfExists(path) != null) {
            throw new BackendEntryIsDirectory(path);
          }

          throw new BackendFileNotFound(path);
        }

        return typeof value === "string"
          ? textEncoder.encode(value)
          : new Uint8Array(value);
      },
      async exists(path: string): Promise<boolean> {
        if (normalizeRootPath(path) === "") {
          return true;
        }

        const filePath = isDirectoryPath(path) ? null : resolve(path);
        if (filePath != null && files.has(filePath)) {
          return true;
        }

        return getDirectoryKeyIfExists(path) != null;
      },
      async stat(path: string): Promise<BackendStat> {
        if (!isDirectoryPath(path)) {
          const fileValue = files.get(resolve(path));
          if (fileValue != null && fileValue !== DIR_MARKER) {
            return {
              type: "file",
              size: byteLength(fileValue),
            };
          }
        }

        if (getDirectoryKeyIfExists(path) != null) {
          return {
            type: "directory",
            size: 0,
          };
        }

        throw new BackendFileNotFound(path);
      },
      async list(path: string, options?: ListOptions): Promise<BackendEntry[]> {
        const recursive = options?.recursive ?? false;

        if (!isDirectoryPath(path) && files.has(resolve(path))) {
          throw new BackendEntryIsFile(path);
        }

        const resolvedPath = resolve(path);
        const normalizedPath = normalizeRootPath(resolvedPath);
        const pathPrefix = normalizedPath === "" ? "" : getDirMarkerKey(normalizedPath);

        if (normalizedPath !== "" && !files.has(pathPrefix) && !hasChildEntries(files, pathPrefix)) {
          throw new BackendFileNotFound(path);
        }

        const entries: BackendEntry[] = [];
        const seenDirs = new Set<string>();
        const requestedPath = normalizeRootPath(path).replace(LEADING_SLASH_RE, "").replace(TRAILING_SLASH_RE, "");

        const prefixToRoot = (relativePath: string): string => {
          if (!requestedPath) {
            return relativePath;
          }

          return relativePath ? `${requestedPath}/${relativePath}` : requestedPath;
        };

        for (const [filePath, value] of files.entries()) {
          if (!filePath.startsWith(pathPrefix)) {
            continue;
          }

          const relativePath = filePath.slice(pathPrefix.length);
          if (!relativePath) {
            continue;
          }

          if (isDirMarkerKey(filePath) && value === DIR_MARKER) {
            const directoryPath = relativePath.slice(0, -1);
            const parts = directoryPath.split("/").filter(Boolean);
            if (parts.length === 0) {
              continue;
            }

            if (!recursive) {
              const dirName = parts[0];
              if (dirName == null) {
                continue;
              }

              if (!seenDirs.has(dirName)) {
                seenDirs.add(dirName);
                entries.push(createMemoryEntry(prefixToRoot(dirName), "directory"));
              }
              continue;
            }

            let currentLevel = entries;
            for (let index = 0; index < parts.length; index++) {
              const part = parts[index];
              if (part == null) {
                continue;
              }

              const partPath = parts.slice(0, index + 1).join("/");
              let entry = currentLevel.find((candidate) => candidate.type === "directory" && candidate.name === part);

              if (entry == null) {
                entry = createMemoryEntry(prefixToRoot(partPath), "directory");
                currentLevel.push(entry);
              }

              if (entry.type === "directory") {
                currentLevel = entry.children;
              }
            }

            continue;
          }

          const parts = relativePath.split("/").filter(Boolean);
          if (parts.length === 0) {
            continue;
          }

          if (!recursive) {
            if (parts.length === 1) {
              const fileName = parts[0];
              if (fileName == null) {
                continue;
              }

              entries.push(createMemoryEntry(prefixToRoot(fileName), "file"));
              continue;
            }

            const dirName = parts[0];
            if (dirName == null) {
              continue;
            }

            if (!seenDirs.has(dirName)) {
              seenDirs.add(dirName);
              entries.push(createMemoryEntry(prefixToRoot(dirName), "directory"));
            }
            continue;
          }

          let currentLevel = entries;
          for (let index = 0; index < parts.length; index++) {
            const part = parts[index];
            if (part == null) {
              continue;
            }

            const partPath = parts.slice(0, index + 1).join("/");
            const isLastPart = index === parts.length - 1;

            if (isLastPart) {
              currentLevel.push(createMemoryEntry(prefixToRoot(partPath), "file"));
              continue;
            }

            let entry = currentLevel.find((candidate) => candidate.type === "directory" && candidate.name === part);
            if (entry == null) {
              entry = createMemoryEntry(prefixToRoot(partPath), "directory");
              currentLevel.push(entry);
            }

            if (entry.type === "directory") {
              currentLevel = entry.children;
            }
          }
        }

        return sortEntries(entries);
      },
      async write(path: string, data: string | Uint8Array): Promise<void> {
        const resolvedPath = resolveFile(path);
        ensureParentDirectories(resolvedPath);
        files.set(resolvedPath, typeof data === "string" ? data : new Uint8Array(data));
      },
      async mkdir(path: string): Promise<void> {
        const resolvedPath = resolveDirectory(path);
        if (resolvedPath === "") {
          return;
        }

        ensureParentDirectories(resolvedPath);
        files.set(resolvedPath, DIR_MARKER);
      },
      async remove(path: string, options?: RemoveOptions): Promise<void> {
        const stat = await operations.stat(path).catch((error: unknown) => {
          if (error instanceof BackendFileNotFound && options?.force === true) {
            return null;
          }

          throw error;
        });

        if (stat == null) {
          return;
        }

        if (stat.type === "file") {
          files.delete(resolveFile(path));
          return;
        }

        if (options?.recursive !== true) {
          throw new BackendEntryIsDirectory(path);
        }

        const directoryKey = resolveDirectory(path);
        if (directoryKey !== "") {
          files.delete(directoryKey);
        }

        for (const filePath of [...files.keys()]) {
          if (directoryKey !== "" && filePath.startsWith(directoryKey)) {
            files.delete(filePath);
          }
        }
      },
      async copy(sourcePath: string, destinationPath: string, options?: CopyOptions): Promise<void> {
        const sourceStat = await operations.stat(sourcePath);
        const destinationStat = await operations.stat(destinationPath).catch((error: unknown) => {
          if (error instanceof BackendFileNotFound) {
            return null;
          }

          throw error;
        });

        if (sourceStat.type === "directory" && options?.recursive !== true) {
          throw new BackendEntryIsDirectory(sourcePath);
        }

        const sourceResolvedPath = sourceStat.type === "directory"
          ? resolveDirectory(sourcePath)
          : resolveFile(sourcePath);
        const destinationActsAsDirectory = sourceStat.type === "file"
          && (isDirectoryPath(destinationPath) || destinationStat?.type === "directory");
        const resolvedDestinationPath = sourceStat.type === "directory"
          ? resolveDirectory(destinationPath)
          : destinationActsAsDirectory
            ? resolveFile(`${destinationPath}/${nodePath.basename(sourcePath)}`)
            : resolveFile(destinationPath);
        const normalizedDestinationPath = normalizeEntryPath(
          nodePath.relative(basePath, resolvedDestinationPath),
          sourceStat.type,
        );

        if (options?.overwrite === false && await operations.exists(normalizedDestinationPath)) {
          throw new CopyDestinationAlreadyExistsError(normalizedDestinationPath);
        }

        if (sourceStat.type === "file") {
          const value = files.get(sourceResolvedPath);
          if (value == null || value === DIR_MARKER) {
            throw new BackendFileNotFound(sourcePath);
          }

          ensureParentDirectories(resolvedDestinationPath);
          files.set(resolvedDestinationPath, cloneValue(value));
          return;
        }

        ensureParentDirectories(resolvedDestinationPath);
        if (resolvedDestinationPath !== "") {
          files.set(resolvedDestinationPath, DIR_MARKER);
        }

        for (const [filePath, value] of [...files.entries()]) {
          if (!filePath.startsWith(sourceResolvedPath)) {
            continue;
          }

          const suffix = filePath.slice(sourceResolvedPath.length);
          const targetPath = `${resolvedDestinationPath}${suffix}`;

          if (value === DIR_MARKER) {
            files.set(targetPath, DIR_MARKER);
            continue;
          }

          ensureParentDirectories(targetPath);
          files.set(targetPath, cloneValue(value));
        }
      },
    };

    if (options?.functions) {
      for (const [key, value] of Object.entries(options.functions)) {
        if (value === false) {
          delete (operations as Record<string, unknown>)[key];
          continue;
        }

        if (value != null) {
          (operations as Record<string, unknown>)[key] = value;
        }
      }
    }

    return operations;
  },
});

export type MemoryMockFS = ReturnType<typeof createMemoryMockFS>;
