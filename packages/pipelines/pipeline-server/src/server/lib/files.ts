import type { PipelineDefinition } from "@ucdjs/pipelines-core";
import type {
  LoadedPipelineFile,
  LoadPipelinesResult,
  PipelineLoadError,
  PipelineSource,
  RemoteCacheStatus,
  RemotePipelineSource,
} from "@ucdjs/pipelines-loader";
import type { PipelineInfo } from "@ucdjs/pipelines-ui";
import path from "node:path";
import {
  CacheMissError,
  findPipelineFiles,
  getRemoteSourceCacheStatus,
  loadPipelinesFromPaths,
  syncRemoteSource,
} from "@ucdjs/pipelines-loader";
import { toPipelineInfo } from "@ucdjs/pipelines-ui";
import { fileIdFromPath, fileLabelFromPath } from "./ids";

export interface FilePipelineEntry {
  pipeline: PipelineDefinition;
  exportName: string;
}

export interface PipelineFileGroup {
  fileId: string;
  filePath: string;
  sourceFilePath?: string;
  fileLabel: string;
  sourceId: string;
  pipelines: PipelineInfo[];
  entries: FilePipelineEntry[];
}

export interface LoadedSourceData {
  sourceId: string;
  source: PipelineSource;
  fileGroups: PipelineFileGroup[];
  errors: PipelineLoadError[];
}

function normalizePath(root: string, filePath: string): string {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

async function loadRemoteSourcePipelines(
  source: RemotePipelineSource,
  cacheStatus: RemoteCacheStatus,
): Promise<LoadPipelinesResult> {
  const files = await findPipelineFiles({
    source: {
      type: source.type,
      owner: source.owner,
      repo: source.repo,
      ref: source.ref,
      path: source.path,
    },
  });

  const ref = source.ref ?? "HEAD";
  const urls = files
    .map((filePath) => normalizePath(cacheStatus.cacheDir, filePath))
    .map((filePath) => `${source.type}://${source.owner}/${source.repo}?ref=${ref}&path=${filePath}`);

  const result = await loadPipelinesFromPaths(urls);

  return {
    ...result,
    files: result.files.map((file) => ({
      ...file,
      filePath: normalizePath(cacheStatus.cacheDir, file.filePath),
    })),
    errors: result.errors.map((error) => ({
      ...error,
      filePath: error.filePath ? normalizePath(cacheStatus.cacheDir, error.filePath) : undefined,
    })),
  };
}

async function loadSourcePipelines(source: PipelineSource): Promise<LoadPipelinesResult> {
  if (source.type === "local") {
    const files = await findPipelineFiles({
      source: { type: "local", cwd: source.cwd },
    });

    const result = await loadPipelinesFromPaths(files);

    return {
      ...result,
      files: result.files.map((file) => ({
        ...file,
        filePath: normalizePath(source.cwd, file.filePath),
      })),
      errors: result.errors.map((error) => ({
        ...error,
        filePath: error.filePath ? normalizePath(source.cwd, error.filePath) : undefined,
      })),
    };
  }

  const cacheStatus = await getRemoteSourceCacheStatus({
    source: source.type,
    owner: source.owner,
    repo: source.repo,
    ref: source.ref,
  });

  try {
    return await loadRemoteSourcePipelines(source, cacheStatus);
  } catch (error) {
    if (!(error instanceof CacheMissError)) {
      throw error;
    }

    const syncResult = await syncRemoteSource({
      source: source.type,
      owner: source.owner,
      repo: source.repo,
      ref: source.ref,
    });

    if (!syncResult.success) {
      return {
        pipelines: [],
        files: [],
        errors: [{
          code: "SYNC_FAILED",
          scope: "source",
          message: `Failed to sync source: ${syncResult.error?.message ?? "Unknown error"}`,
          meta: {
            source: source.type,
            owner: source.owner,
            repo: source.repo,
            ref: source.ref ?? "HEAD",
          },
        }],
      };
    }

    return await loadRemoteSourcePipelines(source, cacheStatus);
  }
}

function toSourceLoadFailureError(source: PipelineSource, reason: unknown): PipelineLoadError {
  return {
    code: "UNKNOWN",
    scope: "source",
    message: reason instanceof Error ? reason.message : String(reason),
    meta: {
      source: source.type,
      sourceId: source.id,
    },
  };
}

function splitErrors(errors: PipelineLoadError[]): {
  sourceErrors: PipelineLoadError[];
  fileErrors: PipelineLoadError[];
} {
  const sourceErrors: PipelineLoadError[] = [];
  const fileErrors: PipelineLoadError[] = [];

  for (const error of errors) {
    if (error.scope === "source") {
      sourceErrors.push(error);
    } else {
      fileErrors.push(error);
    }
  }

  return { sourceErrors, fileErrors };
}

export function buildFileGroups(sourceId: string, files: LoadedPipelineFile[]): PipelineFileGroup[] {
  return files.map((file) => {
    const entries = file.pipelines.map((pipeline, index) => ({
      pipeline,
      exportName: file.exportNames[index] ?? "default",
    }));

    return {
      fileId: fileIdFromPath(file.filePath),
      filePath: file.filePath,
      sourceFilePath: file.sourceFilePath,
      fileLabel: fileLabelFromPath(file.filePath),
      sourceId,
      pipelines: entries.map((entry) => ({
        ...toPipelineInfo(entry.pipeline),
        sourceId,
      })),
      entries,
    };
  });
}

export function findPipelineByFileId(
  fileId: string,
  fileGroups: PipelineFileGroup[],
  pipelineId: string,
): { fileGroup: PipelineFileGroup; entry: FilePipelineEntry } | null {
  const fileGroup = fileGroups.find((group) => group.fileId === fileId);
  if (!fileGroup) {
    return null;
  }

  const entry = fileGroup.entries.find(({ pipeline }) => pipeline.id === pipelineId);
  if (!entry) {
    return null;
  }

  return { fileGroup, entry };
}

export async function loadSourceData(source: PipelineSource): Promise<LoadedSourceData> {
  try {
    const result = await loadSourcePipelines(source);
    return {
      sourceId: source.id,
      source,
      fileGroups: buildFileGroups(source.id, result.files),
      errors: result.errors,
    };
  } catch (error) {
    return {
      sourceId: source.id,
      source,
      fileGroups: [],
      errors: [toSourceLoadFailureError(source, error)],
    };
  }
}

export async function loadSourcesData(sources: PipelineSource[]): Promise<LoadedSourceData[]> {
  return Promise.all(sources.map((source) => loadSourceData(source)));
}

export function sourceErrors(errors: PipelineLoadError[]): PipelineLoadError[] {
  return splitErrors(errors).sourceErrors;
}

export function fileErrors(errors: PipelineLoadError[]): PipelineLoadError[] {
  return splitErrors(errors).fileErrors;
}

export function fileErrorsForPath(
  errors: PipelineLoadError[],
  filePath: string,
  sourceFilePath?: string,
): PipelineLoadError[] {
  return fileErrors(errors).filter((error) =>
    error.filePath === filePath || error.filePath === sourceFilePath,
  );
}

export function unmatchedFileErrors(
  errors: PipelineLoadError[],
  fileGroups: PipelineFileGroup[],
): PipelineLoadError[] {
  return fileErrors(errors).filter((error) => {
    if (!error.filePath) {
      return false;
    }

    return !fileGroups.some((group) =>
      group.filePath === error.filePath || group.sourceFilePath === error.filePath,
    );
  });
}

export function fileErrorsByFileId(errors: PipelineLoadError[], fileId: string): PipelineLoadError[] {
  return fileErrors(errors).filter((error) =>
    Boolean(error.filePath) && fileIdFromPath(error.filePath!) === fileId,
  );
}
