import type { FileMetadata, PipelineSourceDefinition, SourceBackend } from "../source";
import type { FileContext } from "../types";
import { definePipelineSource } from "../source";

export interface MemoryFile {
  path: string;
  content: string;
  dir?: FileContext["dir"];
}

export interface MemoryBackendOptions {
  files: Record<string, MemoryFile[]>;
}

function getFileContext(version: string, file: MemoryFile): FileContext {
  const path = file.path;
  const parts = path.split("/");
  const name = parts[parts.length - 1];
  if (!name) {
    throw new Error(`Invalid file path: ${file.path}`);
  }
  const extIndex = name.lastIndexOf(".");
  const ext = extIndex >= 0 ? name.slice(extIndex) : "";
  const dir = file.dir || parts[0] || "ucd";

  return { version, dir, path, name, ext };
}

export function createMemoryBackend(options: MemoryBackendOptions): SourceBackend {
  const { files } = options;

  return {
    async listFiles(version: string): Promise<FileContext[]> {
      const versionFiles = files[version];
      if (!versionFiles) return [];
      return versionFiles.map((f) => getFileContext(version, f));
    },

    async readFile(file: FileContext): Promise<string> {
      const versionFiles = files[file.version];
      if (!versionFiles) {
        throw new Error(`Version ${file.version} not found in memory backend`);
      }
      const memFile = versionFiles.find((f) => f.path === file.path);
      if (!memFile) {
        throw new Error(`File ${file.path} not found in version ${file.version}`);
      }
      return memFile.content;
    },

    async getMetadata(file: FileContext): Promise<FileMetadata> {
      const versionFiles = files[file.version];
      if (!versionFiles) {
        throw new Error(`Version ${file.version} not found in memory backend`);
      }
      const memFile = versionFiles.find((f) => f.path === file.path);
      if (!memFile) {
        throw new Error(`File ${file.path} not found in version ${file.version}`);
      }
      return { size: new TextEncoder().encode(memFile.content).length };
    },
  };
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
