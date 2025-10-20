import type { FSEntry } from "@ucdjs/fs-bridge";
import { Buffer } from "node:buffer";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { z } from "zod";

export const createMemoryMockFS = defineFileSystemBridge({
  name: "In-Memory File System Bridge",
  description: "A simple in-memory file system bridge using a flat Map for storage, perfect for testing.",
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
        const pathWithSlash = path.endsWith("/") ? path : `${path}/`;
        for (const filePath of state.files.keys()) {
          if (filePath.startsWith(pathWithSlash)) {
            return true;
          }
        }

        return false;
      },
      listdir: async (path, recursive = false) => {
        const entries: FSEntry[] = [];
        const pathPrefix = path.endsWith("/") ? path : `${path}/`;
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
            // Recursive: build tree structure
            // For now, just return flat list of files
            // TODO: build proper tree if needed
            const fileName = parts[parts.length - 1];
            if (fileName) {
              entries.push({
                type: "file" as const,
                name: fileName,
                path: relativePath,
              });
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
        // remove file, if the path matches explicitly
        if (state.files.has(path)) {
          state.files.delete(path);
          return;
        }

        // remove directory (recursive)
        if (options?.recursive) {
          const pathPrefix = path.endsWith("/") ? path : `${path}/`;
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
