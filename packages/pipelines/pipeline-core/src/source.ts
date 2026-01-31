import type { FileContext, PipelineFilter } from "./types";

export interface StreamOptions {
  chunkSize?: number;
  start?: number;
  end?: number;
}

export interface FileMetadata {
  size: number;
  hash?: string;
  lastModified?: string;
}

export interface SourceBackend {
  listFiles(version: string): Promise<FileContext[]>;
  readFile(file: FileContext): Promise<string>;
  readFileStream?(file: FileContext, options?: StreamOptions): AsyncIterable<Uint8Array>;
  getMetadata?(file: FileContext): Promise<FileMetadata>;
}

export interface PipelineSourceDefinition<TId extends string = string> {
  id: TId;
  backend: SourceBackend;
  includes?: PipelineFilter;
  excludes?: PipelineFilter;
}

export interface SourceFileContext extends FileContext {
  source: {
    id: string;
  };
}

export function definePipelineSource<const TId extends string>(
  definition: PipelineSourceDefinition<TId>,
): PipelineSourceDefinition<TId> {
  return definition;
}

export async function resolveSourceFiles(
  source: PipelineSourceDefinition,
  version: string,
): Promise<SourceFileContext[]> {
  const allFiles = await source.backend.listFiles(version);

  const filteredFiles = allFiles.filter((file) => {
    const ctx = { file };

    if (source.includes && !source.includes(ctx)) {
      return false;
    }

    if (source.excludes && source.excludes(ctx)) {
      return false;
    }

    return true;
  });

  return filteredFiles.map((file) => ({
    ...file,
    source: { id: source.id },
  }));
}

export async function resolveMultipleSourceFiles(
  sources: PipelineSourceDefinition[],
  version: string,
): Promise<SourceFileContext[]> {
  const filesByPath = new Map<string, SourceFileContext>();

  for (const source of sources) {
    const files = await resolveSourceFiles(source, version);
    for (const file of files) {
      filesByPath.set(file.path, file);
    }
  }

  return Array.from(filesByPath.values());
}

export type InferSourceId<T> = T extends PipelineSourceDefinition<infer TId> ? TId : never;

export type InferSourceIds<T extends readonly PipelineSourceDefinition[]> = {
  [K in keyof T]: InferSourceId<T[K]>;
}[number];
