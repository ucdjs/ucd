import type { BackendEntry, FileSystemBackend } from "@ucdjs/fs-backend";
import type { PipelineSourceDefinition } from "../source";
import type { FileContext } from "../types";
import { defineBackend } from "@ucdjs/fs-backend";
import { z } from "zod";
import { definePipelineSource } from "../source";

export interface MemoryFile {
  path: string;
  content: string;
  dir?: FileContext["dir"];
}

export interface MemoryBackendOptions {
  files: Record<string, MemoryFile[]>;
}

function resolveMemoryFile(files: Record<string, MemoryFile[]>, path: string): { version: string; file: MemoryFile } | null {
  for (const [version, versionFiles] of Object.entries(files)) {
    const file = versionFiles.find((f) => f.path === path || `${version}/${f.path}` === path);
    if (file) return { version, file };
  }
  return null;
}

const MemoryFileSystemBackend = defineBackend({
  meta: {
    name: "Memory File System Backend",
    description: "An in-memory file system backend for testing and playground use.",
  },
  optionsSchema: z.custom<MemoryBackendOptions>(),
  setup(options) {
    const { files } = options;

    return {
      async read(path) {
        const resolved = resolveMemoryFile(files, path);
        if (!resolved) {
          throw new Error(`File not found in memory backend: ${path}`);
        }
        return resolved.file.content;
      },
      async readBytes(path) {
        const resolved = resolveMemoryFile(files, path);
        if (!resolved) {
          throw new Error(`File not found in memory backend: ${path}`);
        }
        return new TextEncoder().encode(resolved.file.content);
      },
      async list(path) {
        const versionFiles = files[path];
        if (!versionFiles) return [];

        return versionFiles.map((f): BackendEntry => {
          const parts = f.path.split("/");
          const name = parts.at(-1) || f.path;
          return { type: "file", name, path: f.path };
        });
      },
      async exists(path) {
        return resolveMemoryFile(files, path) != null
          || files[path] != null;
      },
      async stat(path) {
        const resolved = resolveMemoryFile(files, path);
        if (!resolved) {
          throw new Error(`File not found in memory backend: ${path}`);
        }
        return {
          type: "file" as const,
          size: new TextEncoder().encode(resolved.file.content).length,
        };
      },
    };
  },
});

export function createMemoryBackend(options: MemoryBackendOptions): FileSystemBackend {
  return MemoryFileSystemBackend(options);
}

export interface MemorySourceOptions {
  id?: string;
  files: Record<string, MemoryFile[]>;
}

export function createMemorySource(options: MemorySourceOptions & { id?: undefined }): PipelineSourceDefinition<"memory">;
export function createMemorySource<TId extends string>(options: MemorySourceOptions & { id: TId }): PipelineSourceDefinition<TId>;
export function createMemorySource(options?: MemorySourceOptions): PipelineSourceDefinition<string> {
  const id = options?.id ?? "memory";
  return definePipelineSource({
    id,
    backend: createMemoryBackend({ files: options?.files ?? {} }),
  });
}
