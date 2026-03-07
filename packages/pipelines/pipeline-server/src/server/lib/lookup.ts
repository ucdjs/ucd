import type { PipelineDefinition } from "@ucdjs/pipelines-core";
import type { PipelineSource } from "@ucdjs/pipelines-loader";
import path from "node:path";
import {
  findPipelineFiles,
  getRemoteSourceCacheStatus,
  loadPipelineFile,
  loadPipelinesFromPaths,
} from "@ucdjs/pipelines-loader";
import { fileIdFromPath, fileLabelFromPath } from "./ids";

export function findSource(sources: PipelineSource[], sourceId: string): PipelineSource | null {
  return sources.find((s) => s.id === sourceId) ?? null;
}

export function sourceLabel(source: PipelineSource): string {
  if (source.type === "local") return "local";
  return `${source.owner}/${source.repo}`;
}

export interface DiscoveredFile {
  id: string;
  relativePath: string;
  /** Absolute local path (local) or github://... URL (remote) — for loadPipelineFile */
  loadPath: string;
  label: string;
}

export interface DiscoverResult {
  files: DiscoveredFile[];
  errors: Array<{ message: string; filePath?: string }>;
}

export async function discoverSourceFiles(source: PipelineSource): Promise<DiscoverResult> {
  if (source.type === "local") {
    const result = await findPipelineFiles({
      source: { type: "local", cwd: source.cwd },
    });

    const files = result.files.map((absolutePath) => {
      const relativePath = path.relative(source.cwd, absolutePath).replace(/\\/g, "/");
      return {
        id: fileIdFromPath(relativePath),
        relativePath,
        loadPath: absolutePath,
        label: fileLabelFromPath(relativePath),
      };
    });

    const errors = result.errors.map((e) => ({
      message: e.message,
      filePath: e.filePath,
    }));

    return { files, errors };
  }

  const { owner, repo, ref = "HEAD" } = source;
  const status = await getRemoteSourceCacheStatus({
    source: source.type,
    owner,
    repo,
    ref,
  });

  if (!status.cached) {
    return {
      files: [],
      errors: [{ message: `Remote source "${source.id}" is not cached. Run cache refresh first.` }],
    };
  }

  const result = await findPipelineFiles({
    source: { type: source.type, owner, repo, ref, path: (source as any).path },
  });

  const files = result.files.map((absolutePath) => {
    const relativePath = path.relative(status.cacheDir, absolutePath).replace(/\\/g, "/");
    return {
      id: fileIdFromPath(relativePath),
      relativePath,
      loadPath: `${source.type}://${owner}/${repo}?ref=${ref}&path=${absolutePath}`,
      label: fileLabelFromPath(relativePath),
    };
  });

  const errors = result.errors.map((e) => ({
    message: e.message,
    filePath: e.filePath,
  }));

  return { files, errors };
}

export interface LoadedFilePipeline {
  pipeline: PipelineDefinition;
  exportName: string;
}

export interface LoadedFile {
  id: string;
  relativePath: string;
  label: string;
  pipelines: LoadedFilePipeline[];
}

export interface LoadSourceFilesResult {
  files: LoadedFile[];
  errors: Array<{ message: string; filePath?: string }>;
}

export async function loadSourceFiles(source: PipelineSource): Promise<LoadSourceFilesResult> {
  const discovery = await discoverSourceFiles(source);
  const loadPaths = discovery.files.map((f) => f.loadPath);

  if (loadPaths.length === 0) {
    return { files: [], errors: discovery.errors };
  }

  const result = await loadPipelinesFromPaths(loadPaths);

  const files: LoadedFile[] = result.files.map((file) => {
    const discovered = discovery.files.find((d) => d.loadPath === file.filePath
      || d.loadPath === file.sourceFilePath);

    const relativePath = discovered?.relativePath
      ?? (source.type === "local"
        ? path.relative(source.cwd, file.filePath).replace(/\\/g, "/")
        : file.filePath);

    return {
      id: discovered?.id ?? fileIdFromPath(relativePath),
      relativePath,
      label: discovered?.label ?? fileLabelFromPath(relativePath),
      pipelines: file.pipelines.map((pipeline, i) => ({
        pipeline,
        exportName: file.exportNames[i] ?? "default",
      })),
    };
  });

  const errors = [
    ...discovery.errors,
    ...result.errors.map((e) => ({ message: e.message, filePath: e.filePath })),
  ];

  return { files, errors };
}

export async function loadOneSourceFile(
  source: PipelineSource,
  fileId: string,
): Promise<LoadedFile | null> {
  const discovery = await discoverSourceFiles(source);
  const discovered = discovery.files.find((f) => f.id === fileId);

  if (!discovered) return null;

  try {
    const file = await loadPipelineFile(discovered.loadPath);

    return {
      id: discovered.id,
      relativePath: discovered.relativePath,
      label: discovered.label,
      pipelines: file.pipelines.map((pipeline, i) => ({
        pipeline,
        exportName: file.exportNames[i] ?? "default",
      })),
    };
  } catch {
    return null;
  }
}

export function findPipelineInFile(
  pipelines: LoadedFilePipeline[],
  pipelineId: string,
): LoadedFilePipeline | null {
  return pipelines.find(({ pipeline }) => pipeline.id === pipelineId) ?? null;
}
