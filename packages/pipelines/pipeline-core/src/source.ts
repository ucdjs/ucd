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
  listFiles: (version: string) => Promise<FileContext[]>;
  readFile: (file: FileContext) => Promise<string>;
  readFileStream?: (file: FileContext, options?: StreamOptions) => AsyncIterable<Uint8Array>;
  getMetadata?: (file: FileContext) => Promise<FileMetadata>;
}

export interface PipelineSourceDefinition<TId extends string = string> {
  id: TId;
  backend: SourceBackend;
  includes?: PipelineFilter;
  excludes?: PipelineFilter;
  kind?: "standard" | "pipeline-output";
}

export interface PipelineOutputSourceDefinition<TId extends string = string> extends PipelineSourceDefinition<TId> {
  kind: "pipeline-output";
  pipelineId: string;
  outputId?: string;
}

export interface SourceFileContext extends FileContext {
  source: {
    id: string;
  };
}

export interface ResolveSourceContext {
  logger: import("./logger").PipelineLogger;
}

export function definePipelineSource<const TId extends string>(
  definition: PipelineSourceDefinition<TId>,
): PipelineSourceDefinition<TId> {
  return definition;
}

const unsupportedPipelineOutputBackend: SourceBackend = {
  listFiles: async () => {
    throw new Error("Pipeline output sources are resolved by the executor and cannot be listed directly.");
  },
  readFile: async () => {
    throw new Error("Pipeline output sources are resolved by the executor and cannot be read directly.");
  },
};

export function pipelineOutputSource<const TId extends string = string>(
  options: {
    id?: TId;
    pipelineId: string;
    outputId?: string;
  },
): PipelineOutputSourceDefinition<TId> {
  return {
    id: (options.id ?? `pipeline:${options.pipelineId}${options.outputId ? `:${options.outputId}` : ""}`) as TId,
    kind: "pipeline-output",
    pipelineId: options.pipelineId,
    outputId: options.outputId,
    backend: unsupportedPipelineOutputBackend,
  };
}

export function isPipelineOutputSource(
  source: PipelineSourceDefinition,
): source is PipelineOutputSourceDefinition {
  return source.kind === "pipeline-output";
}

export async function resolveSourceFiles(
  source: PipelineSourceDefinition,
  version: string,
  { logger }: ResolveSourceContext,
): Promise<SourceFileContext[]> {
  if (isPipelineOutputSource(source)) {
    return [];
  }

  const allFiles = await source.backend.listFiles(version);

  const filteredFiles = allFiles.filter((file) => {
    const ctx = { file, logger };

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
  sources: PipelineSourceDefinition[] | readonly PipelineSourceDefinition[],
  version: string,
  context: ResolveSourceContext,
): Promise<SourceFileContext[]> {
  const filesByPath = new Map<string, SourceFileContext>();

  for (const source of sources) {
    const files = await resolveSourceFiles(source, version, context);
    for (const file of files) {
      filesByPath.set(file.path, file);
    }
  }

  return [...filesByPath.values()];
}

export type InferSourceId<T> = T extends PipelineSourceDefinition<infer TId> ? TId : never;

export type InferSourceIds<T extends readonly PipelineSourceDefinition[]> = {
  [K in keyof T]: InferSourceId<T[K]>;
}[number];
