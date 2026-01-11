import type { FileSystemBridgeOperations, FSEntry } from "@ucdjs/fs-bridge";
import { Buffer } from "node:buffer";
import { appendTrailingSlash, prependLeadingSlash } from "@luxass/utils/path";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { FileEntrySchema } from "@ucdjs/schemas";
import { z } from "zod";

/**
 * Normalizes root path inputs to an empty string.
 * Treats "", ".", "/" and undefined as the empty root.
 */
function normalizeRootPath(path: string | undefined): string {
  return (!path || path === "." || path === "/") ? "" : path;
}

/**
 * Formats a relative path to match FSEntry schema requirements (parity with node/http bridges):
 * - Leading slash required for all paths
 * - Trailing slash required for directories
 */
function formatEntryPath(relativePath: string, isDirectory: boolean): string {
  const withLeadingSlash = prependLeadingSlash(relativePath);
  return isDirectory ? appendTrailingSlash(withLeadingSlash) : withLeadingSlash;
}

/**
 * Marker value for explicit directories in the flat Map storage.
 * Directories are stored as "path/" -> DIR_MARKER
 */
const DIR_MARKER = Symbol("directory");

/**
 * Checks if a path represents an explicit directory marker.
 */
function isDirMarkerKey(path: string): boolean {
  return path.endsWith("/");
}

/**
 * Gets the directory marker key for a given path.
 */
function getDirMarkerKey(path: string): string {
  const normalized = normalizeRootPath(path);
  if (normalized === "") return "";
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

export const createMemoryMockFS = defineFileSystemBridge({
  meta: {
    name: "In-Memory File System Bridge",
    description: "A simple in-memory file system bridge using a flat Map for storage, perfect for testing.",
  },
  optionsSchema: z.object({
    /**
     * Base path for the filesystem - all operations are sandboxed to this path.
     * Paths are resolved relative to this base path using `resolveSafePath`.
     * @default "/"
     */
    basePath: z.string().optional(),
    initialFiles: z.record(z.string(), z.string()).optional(),
    functions: z.object({
      read: z.xor([
        z.function({
          input: [
            z.string(),
          ],
          output: z.promise(z.string()),
        }),
        z.literal(false),
      ]).optional(),
      exists: z.xor([
        z.function({
          input: [
            z.string(),
          ],
          output: z.promise(z.boolean()),
        }),
        z.literal(false),
      ]).optional(),
      listdir: z.xor([
        z.function({
          input: [
            z.string(),
            z.boolean().optional(),
          ],
          output: z.promise(z.array(FileEntrySchema)),
        }),
        z.literal(false),
      ]).optional(),
      write: z.xor([
        z.function({
          input: [
            z.string(),
            z.xor([z.string(), z.instanceof(Uint8Array)]),
            z.string().optional(),
          ],
          output: z.promise(z.void()),
        }),
        z.literal(false),
      ]).optional(),
      mkdir: z.xor([
        z.function({
          input: [
            z.string(),
            z.object({ recursive: z.boolean().optional() }).optional(),
          ],
          output: z.promise(z.void()),
        }),
        z.literal(false),
      ]).optional(),
      rm: z.xor([
        z.function({
          input: [
            z.string(),
            z.object({ recursive: z.boolean().optional(), force: z.boolean().optional() }).optional(),
          ],
          output: z.promise(z.void()),
        }),
        z.literal(false),
      ]).optional(),
    }).partial().optional(),
  }).optional(),
  state: {
    files: new Map<string, string | typeof DIR_MARKER>(),
  },
  setup({ options, state, resolveSafePath }) {
    const basePath = options?.basePath ?? "/";

    // Helper to resolve path safely within basePath
    const resolve = (path: string): string => {
      return resolveSafePath(basePath, path);
    };

    if (options?.initialFiles) {
      for (const [path, content] of Object.entries(options.initialFiles)) {
        // Resolve paths relative to basePath
        state.files.set(resolve(path), content);
      }
    }

    // Default implementations
    const operations: Partial<FileSystemBridgeOperations> = {
      read: async (path: string) => {
        const resolvedPath = resolve(path);
        const content = state.files.get(resolvedPath);
        if (content === undefined) {
          throw new Error(`ENOENT: no such file or directory, open '${resolvedPath}'`);
        }
        if (content === DIR_MARKER) {
          throw new Error(`EISDIR: illegal operation on a directory, read '${resolvedPath}'`);
        }
        return content;
      },
      exists: async (path: string) => {
        const resolvedPath = resolve(path);

        // fast path for checking direct entry existence (file)
        if (state.files.has(resolvedPath)) {
          return true;
        }

        // check for explicit directory marker
        const dirMarkerKey = getDirMarkerKey(resolvedPath);
        if (dirMarkerKey && state.files.has(dirMarkerKey)) {
          return true;
        }

        // slower path for checking directory existence (implicit - if any file starts with path/)
        const normalizedPath = normalizeRootPath(resolvedPath);
        const pathWithSlash = normalizedPath === "" ? "" : (normalizedPath.endsWith("/") ? normalizedPath : `${normalizedPath}/`);
        for (const filePath of state.files.keys()) {
          if (filePath.startsWith(pathWithSlash)) {
            return true;
          }
        }

        return false;
      },
      listdir: async (path: string, recursive = false) => {
        const resolvedPath = resolve(path);
        const entries: FSEntry[] = [];

        // Used for filtering state.files (resolved/sandboxed paths)
        const normalizedPath = normalizeRootPath(resolvedPath);
        const pathPrefix = normalizedPath === "" ? "" : (normalizedPath.endsWith("/") ? normalizedPath : `${normalizedPath}/`);

        // Used for emitted FSEntry.path (bridge-root-relative paths)
        const requestedPath = normalizeRootPath(path)
          .replace(/^\/+/, "")
          .replace(/\/+$/, "");

        const prefixToRoot = (relative: string): string => {
          if (!requestedPath) {
            return relative;
          }

          if (!relative) {
            return requestedPath;
          }

          return `${requestedPath}/${relative}`;
        };

        const seenDirs = new Set<string>();

        for (const [filePath, value] of state.files.entries()) {
          // skip files not in this directory
          if (!filePath.startsWith(pathPrefix)) {
            continue;
          }

          const relativePath = filePath.slice(pathPrefix.length);

          // Handle explicit directory markers (entries ending with /)
          if (isDirMarkerKey(filePath) && value === DIR_MARKER) {
            // relativePath will be like "dirname/" - remove trailing slash
            const dirPath = relativePath.slice(0, -1);
            const parts = dirPath.split("/");

            if (!recursive) {
              // Non-recursive: only direct children (single part directory names)
              if (parts.length === 1 && parts[0]) {
                const dirName = parts[0];
                if (!seenDirs.has(dirName)) {
                  seenDirs.add(dirName);
                  entries.push({
                    type: "directory" as const,
                    name: dirName,
                    path: formatEntryPath(prefixToRoot(dirName), true),
                    children: [],
                  });
                }
              }
            } else {
              // Recursive: build nested directory structure
              let currentLevel = entries;
              for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (!part) continue;

                const partPath = parts.slice(0, i + 1).join("/");
                let dirEntry = currentLevel.find(
                  (e) => e.type === "directory" && e.name === part,
                ) as Extract<FSEntry, { type: "directory" }> | undefined;

                if (!dirEntry) {
                  dirEntry = {
                    type: "directory" as const,
                    name: part,
                    path: formatEntryPath(prefixToRoot(partPath), true),
                    children: [],
                  };
                  currentLevel.push(dirEntry);
                }

                currentLevel = dirEntry.children!;
              }
            }
            continue;
          }

          const parts = relativePath.split("/");

          if (!recursive) {
            // Non-recursive: only direct children
            if (parts.length === 1 && parts[0]) {
              // Direct file
              entries.push({
                type: "file" as const,
                name: parts[0],
                path: formatEntryPath(prefixToRoot(relativePath), false),
              });
            } else if (parts.length > 1 && parts[0]) {
              // Directory (implicit from file path)
              const dirName = parts[0];
              if (!seenDirs.has(dirName)) {
                seenDirs.add(dirName);
                entries.push({
                  type: "directory" as const,
                  name: dirName,
                  path: formatEntryPath(prefixToRoot(dirName), true),
                  children: [],
                });
              }
            }
          } else {
            let currentLevel = entries;

            for (let i = 0; i < parts.length; i++) {
              const part = parts[i];
              if (!part) continue;

              const isLastPart = i === parts.length - 1;
              const partPath = parts.slice(0, i + 1).join("/");

              if (isLastPart) {
                // It's a file
                currentLevel.push({
                  type: "file" as const,
                  name: part,
                  path: formatEntryPath(prefixToRoot(partPath), false),
                });
              } else {
                // It's a directory - find or create it
                let dirEntry = currentLevel.find(
                  (e) => e.type === "directory" && e.name === part,
                ) as Extract<FSEntry, { type: "directory" }> | undefined;

                if (!dirEntry) {
                  dirEntry = {
                    type: "directory" as const,
                    name: part,
                    path: formatEntryPath(prefixToRoot(partPath), true),
                    children: [],
                  };
                  currentLevel.push(dirEntry);
                }

                currentLevel = dirEntry.children!;
              }
            }
          }
        }

        return entries;
      },
      write: async (path: string, data: string | Uint8Array, encoding = "utf8") => {
        const resolvedPath = resolve(path);
        const content = typeof data === "string"
          ? data
          : Buffer.from(data).toString(encoding);
        state.files.set(resolvedPath, content);
      },
      mkdir: async (path: string) => {
        const resolvedPath = resolve(path);
        const normalizedPath = normalizeRootPath(resolvedPath);
        if (normalizedPath === "") {
          // Root directory always exists, nothing to create
          return;
        }

        // Create directory marker (path ending with /)
        const dirMarkerKey = getDirMarkerKey(normalizedPath);
        state.files.set(dirMarkerKey, DIR_MARKER);

        // Also create parent directories (recursive mkdir behavior, like Node.js)
        const parts = normalizedPath.split("/");
        for (let i = 1; i < parts.length; i++) {
          const parentPath = parts.slice(0, i).join("/");
          const parentMarkerKey = getDirMarkerKey(parentPath);
          if (parentMarkerKey && !state.files.has(parentMarkerKey)) {
            state.files.set(parentMarkerKey, DIR_MARKER);
          }
        }
      },
      rm: async (path: string, options?: { recursive?: boolean; force?: boolean }) => {
        const resolvedPath = resolve(path);
        // TODO(luxass): should we align this with real node:fs behavior and throw if file/dir doesn't exist?

        // remove file, if the path matches explicitly
        if (state.files.has(resolvedPath)) {
          state.files.delete(resolvedPath);
          return;
        }

        // remove explicit directory marker
        const dirMarkerKey = getDirMarkerKey(resolvedPath);
        if (dirMarkerKey && state.files.has(dirMarkerKey)) {
          state.files.delete(dirMarkerKey);
        }

        // remove directory contents (recursive)
        if (options?.recursive) {
          const normalizedPath = normalizeRootPath(resolvedPath);
          const pathPrefix = normalizedPath === "" ? "" : (normalizedPath.endsWith("/") ? normalizedPath : `${normalizedPath}/`);
          const keysToDelete: string[] = [];

          for (const filePath of state.files.keys()) {
            if (filePath.startsWith(pathPrefix)) {
              keysToDelete.push(filePath);
            }
          }

          for (const key of keysToDelete) {
            state.files.delete(key);
          }
        }
      },
    };

    // Apply function overrides / disables from options
    if (options?.functions) {
      const fns = options.functions;
      for (const key of Object.keys(fns) as Array<keyof typeof fns>) {
        const val = (fns as any)[key];
        if (val === false) {
          delete (operations as any)[key];
        } else {
          (operations as any)[key] = val;
        }
      }
    }

    return operations as unknown as FileSystemBridgeOperations;
  },
});
