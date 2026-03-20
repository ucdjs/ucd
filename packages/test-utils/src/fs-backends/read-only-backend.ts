import type { BackendEntry, BackendStat, FileSystemBackend } from "@ucdjs/fs-backend";
import { BackendEntryIsDirectory, BackendEntryIsFile, BackendFileNotFound, defineBackend } from "@ucdjs/fs-backend";
import { isDirectoryPath } from "@ucdjs/fs-backend/utils";
import { vi } from "vitest";

export interface CreateReadOnlyBackendOptions {
  read?: (path: string) => Promise<string>;
  readBytes?: (path: string) => Promise<Uint8Array>;
  exists?: (path: string) => Promise<boolean>;
  stat?: (path: string) => Promise<BackendStat>;
  list?: (path: string, options?: { recursive?: boolean }) => Promise<BackendEntry[]>;
}

export function createReadOnlyBackend(
  options: CreateReadOnlyBackendOptions = {},
): FileSystemBackend {
  return defineBackend({
    meta: {
      name: "Read-Only Test Backend",
      description: "A read-only backend for tests.",
    },
    setup: () => {
      const existsFn = options.exists ?? vi.fn().mockResolvedValue(true);

      return {
        read: options.read ?? vi.fn().mockImplementation(async (path: string) => {
          if (isDirectoryPath(path)) {
            throw new BackendEntryIsDirectory(path);
          }

          if ((await existsFn(path)) === false) {
            throw new BackendFileNotFound(path);
          }

          return "content";
        }),
        readBytes: options.readBytes ?? vi.fn().mockImplementation(async (path: string) => {
          if (isDirectoryPath(path)) {
            throw new BackendEntryIsDirectory(path);
          }

          if ((await existsFn(path)) === false) {
            throw new BackendFileNotFound(path);
          }

          return new TextEncoder().encode("content");
        }),
        exists: existsFn,
        stat: options.stat ?? vi.fn().mockImplementation(async (path: string) => {
          if ((await existsFn(path)) === false) {
            throw new BackendFileNotFound(path);
          }

          if (isDirectoryPath(path)) {
            return {
              type: "directory",
              size: 0,
            };
          }

          return {
            type: "file",
            size: 0,
          };
        }),
        list: options.list ?? vi.fn().mockImplementation(async (path: string) => {
          if ((await existsFn(path)) === false) {
            throw new BackendFileNotFound(path);
          }

          if (!isDirectoryPath(path)) {
            throw new BackendEntryIsFile(path);
          }

          return [];
        }),
      };
    },
  })();
}
