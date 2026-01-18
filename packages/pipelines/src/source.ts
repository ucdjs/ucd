import type { FileContext, PipelineFilter } from "./types";

/**
 * Options for streaming file content.
 */
export interface StreamOptions {
  /**
   * The size of each chunk in bytes.
   */
  chunkSize?: number;

  /**
   * The byte offset to start reading from.
   */
  start?: number;

  /**
   * The byte offset to stop reading at (exclusive).
   */
  end?: number;
}

/**
 * Metadata about a file.
 */
export interface FileMetadata {
  /**
   * The size of the file in bytes.
   */
  size: number;

  /**
   * Optional hash of the file content (e.g., SHA-256).
   */
  hash?: string;

  /**
   * Optional last modified timestamp (ISO 8601 format).
   */
  lastModified?: string;
}

/**
 * Backend interface for providing files to the pipeline.
 * Implementations can wrap different storage systems (fs-bridge, HTTP, in-memory, etc.).
 */
export interface SourceBackend {
  /**
   * List all files available for a given Unicode version.
   */
  listFiles(version: string): Promise<FileContext[]>;

  /**
   * Read the full content of a file as a string.
   */
  readFile(file: FileContext): Promise<string>;

  /**
   * Optional: Stream file content as chunks.
   * Useful for large files to avoid loading everything into memory.
   */
  readFileStream?(file: FileContext, options?: StreamOptions): AsyncIterable<Uint8Array>;

  /**
   * Optional: Get metadata about a file without reading its content.
   */
  getMetadata?(file: FileContext): Promise<FileMetadata>;
}

/**
 * Definition for a pipeline source.
 * A source provides files from a specific backend with optional filtering.
 */
export interface PipelineSourceDefinition<TId extends string = string> {
  /**
   * Unique identifier for this source.
   */
  id: TId;

  /**
   * The backend that provides file access.
   */
  backend: SourceBackend;

  /**
   * Optional filter to include only matching files.
   * If not specified, all files from the backend are included.
   */
  includes?: PipelineFilter;

  /**
   * Optional filter to exclude matching files.
   * Applied after includes filter.
   */
  excludes?: PipelineFilter;
}

/**
 * A source with resolved file context that includes source metadata.
 */
export interface SourceFileContext extends FileContext {
  /**
   * The source this file came from.
   */
  source: {
    /**
     * The source ID.
     */
    id: string;
  };
}

/**
 * Define a pipeline source with a specific backend and optional filters.
 *
 * @example
 * ```ts
 * const httpSource = definePipelineSource({
 *   id: "unicode-http",
 *   backend: createHttpBackend({ baseUrl: "https://unicode.org/Public" }),
 *   includes: byGlob("**\/*.txt"),
 *   excludes: byGlob("**\/Test*.txt"),
 * });
 * ```
 */
export function definePipelineSource<const TId extends string>(
  definition: PipelineSourceDefinition<TId>,
): PipelineSourceDefinition<TId> {
  return definition;
}

/**
 * Resolve files from a source for a given version, applying include/exclude filters.
 */
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

/**
 * Resolve files from multiple sources, merging results.
 * Files from later sources with the same path will override earlier ones.
 */
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

/**
 * Type helper to extract the ID type from a source definition.
 */
export type InferSourceId<T> = T extends PipelineSourceDefinition<infer TId> ? TId : never;

/**
 * Type helper to extract IDs from multiple source definitions.
 */
export type InferSourceIds<T extends readonly PipelineSourceDefinition[]> = {
  [K in keyof T]: InferSourceId<T[K]>;
}[number];
