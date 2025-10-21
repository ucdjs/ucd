import type { FSEntry } from "@ucdjs/fs-bridge";
import { Buffer } from "node:buffer";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { z } from "zod";

/**
 * Normalizes root path inputs to an empty string.
 * Treats "", ".", "/" and undefined as the empty root.
 */
function normalizeRootPath(path: string | undefined): string {
  return (!path || path === "." || path === "/") ? "" : path;
}

export const createMemoryMockFS = defineFileSystemBridge({
  meta: {
    name: "In-Memory File System Bridge",
    description: "A simple in-memory file system bridge using a flat Map for storage, perfect for testing.",
  },
  optionsSchema: z.object({
    initialFiles: z.record(z.string(), z.string()).optional(),
  }).optional(),
  state: {
    files: new Map<string, string>(),
  },
  setup({ options, state }) {
    if (options?.initialFiles) {
      for (const [path, content] of Object.entries(options.initialFiles)) {
        state.files.set(path, content);
      }
    }
    return {
      read: async (path) => {
        const content = state.files.get(path);
        if (content === undefined) {
          throw new Error(`ENOENT: no such file or directory, open '${path}'`);
        }
        return content;
      },
      exists: async (path) => {
        // fast path for checking direct entry existence
        if (state.files.has(path)) {
          return true;
        }

        // slower path for checking directory existence (implicit - if any file starts with path/)
        const normalizedPath = normalizeRootPath(path);
        const pathWithSlash = normalizedPath === "" ? "" : (normalizedPath.endsWith("/") ? normalizedPath : `${normalizedPath}/`);
        for (const filePath of state.files.keys()) {
          if (filePath.startsWith(pathWithSlash)) {
            return true;
          }
        }

        return false;
      },
      listdir: async (path, recursive = false) => {
        const entries: FSEntry[] = [];
        const normalizedPath = normalizeRootPath(path);
        const pathPrefix = normalizedPath === "" ? "" : (normalizedPath.endsWith("/") ? normalizedPath : `${normalizedPath}/`);
        const seenDirs = new Set<string>();

        for (const filePath of state.files.keys()) {
          // skip files not in this directory
          if (!filePath.startsWith(pathPrefix)) {
            continue;
          }

          const relativePath = filePath.slice(pathPrefix.length);
          const parts = relativePath.split("/");

          if (!recursive) {
            // Non-recursive: only direct children
            if (parts.length === 1 && parts[0]) {
              // Direct file
              entries.push({
                type: "file" as const,
                name: parts[0],
                path: relativePath,
              });
            } else if (parts.length > 1 && parts[0]) {
              // Directory (implicit)
              const dirName = parts[0];
              if (!seenDirs.has(dirName)) {
                seenDirs.add(dirName);
                entries.push({
                  type: "directory" as const,
                  name: dirName,
                  path: dirName,
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
                  path: partPath,
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
                    path: partPath,
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
      write: async (path, data, encoding = "utf8") => {
        const content = typeof data === "string"
          ? data
          : Buffer.from(data).toString(encoding);
        state.files.set(path, content);
      },
      mkdir: async (_path) => {
        // no-op: directories are implicit in flat Map storage
      },
      rm: async (path, options) => {
        // TODO(luxass): should we align this with real node:fs behavior and throw if file/dir doesn't exist?

        // remove file, if the path matches explicitly
        if (state.files.has(path)) {
          state.files.delete(path);
          return;
        }

        // remove directory (recursive)
        if (options?.recursive) {
          const normalizedPath = normalizeRootPath(path);
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
  },
});
