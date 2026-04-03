import type { BackendEntry, FileSystemBackend } from "@ucdjs/fs-backend";
import type { FileContext, PipelineFilter, PipelineLogger } from "./types";

export interface PipelineSourceDefinition<TId extends string = string> {
  id: TId;
  backend: FileSystemBackend;
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
  logger: PipelineLogger;
}

export function definePipelineSource<const TId extends string>(
  definition: PipelineSourceDefinition<TId>,
): PipelineSourceDefinition<TId> {
  return definition;
}

const UNSUPPORTED_MSG = "Pipeline output sources are resolved by the executor and cannot be accessed directly.";

const unsupportedPipelineOutputBackend: FileSystemBackend = {
  meta: { name: "unsupported-pipeline-output" },
  features: new Set(),
  hook: () => () => {},
  read: async () => { throw new Error(UNSUPPORTED_MSG); },
  readBytes: async () => { throw new Error(UNSUPPORTED_MSG); },
  list: async () => { throw new Error(UNSUPPORTED_MSG); },
  exists: async () => { throw new Error(UNSUPPORTED_MSG); },
  stat: async () => { throw new Error(UNSUPPORTED_MSG); },
  write: async () => { throw new Error(UNSUPPORTED_MSG); },
  mkdir: async () => { throw new Error(UNSUPPORTED_MSG); },
  remove: async () => { throw new Error(UNSUPPORTED_MSG); },
  copy: async () => { throw new Error(UNSUPPORTED_MSG); },
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

function backendEntryToFileContext(entry: BackendEntry, version: string): FileContext {
  let path = entry.path;
  // Strip leading slash (HTTP backend returns absolute paths like "/16.0.0/ucd/file.txt")
  if (path.startsWith("/")) path = path.slice(1);
  // Strip version prefix if present (e.g., "16.0.0/ucd/file.txt" → "ucd/file.txt")
  if (path.startsWith(`${version}/`)) path = path.slice(version.length + 1);

  const name = entry.name;
  const extIndex = name.lastIndexOf(".");
  const ext = extIndex > 0 ? name.slice(extIndex) : "";
  const parts = path.split("/");
  const dir = parts[0] || "ucd";

  return { version, dir, path, name, ext };
}

function flattenEntries(entries: BackendEntry[]): BackendEntry[] {
  const result: BackendEntry[] = [];
  for (const entry of entries) {
    if (entry.type === "file") {
      result.push(entry);
    } else if (entry.type === "directory" && entry.children) {
      result.push(...flattenEntries(entry.children));
    }
  }
  return result;
}

export async function resolveSourceFiles(
  source: PipelineSourceDefinition,
  version: string,
  { logger }: ResolveSourceContext,
): Promise<SourceFileContext[]> {
  if (isPipelineOutputSource(source)) {
    return [];
  }

  const entries = await source.backend.list(version, { recursive: true });
  const fileEntries = flattenEntries(entries);
  const allFiles = fileEntries.map((entry) => backendEntryToFileContext(entry, version));

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
