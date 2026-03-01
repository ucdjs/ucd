import type {
  LoadPipelinesResult,
  PipelineSource,
  RemoteCacheStatus,
  RemotePipelineSource,
} from "@ucdjs/pipelines-loader";
import path from "node:path";
import {
  CacheMissError,
  findPipelineFiles,
  getRemoteSourceCacheStatus,
  loadPipelinesFromPaths,
  syncRemoteSource,
} from "@ucdjs/pipelines-loader";

export interface GetPipelinesResult {
  result: LoadPipelinesResult;
  cacheError?: {
    message: string;
    source: string;
    owner: string;
    repo: string;
    ref: string;
  };
}

async function loadRemoteSourceFiles(
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

  // Normalize file paths to be relative to cache directory
  const normalize = (filePath: string) =>
    path.relative(cacheStatus.cacheDir, filePath).replace(/\\/g, "/");

  const normalizedFiles = files.map(normalize);

  // Convert to github:// or gitlab:// URLs for loading
  const ref = source.ref ?? "HEAD";
  const urls = normalizedFiles.map((filePath) => {
    return `${source.type}://${source.owner}/${source.repo}?ref=${ref}&path=${filePath}`;
  });

  const result = await loadPipelinesFromPaths(urls);

  // Return files with normalized paths (not the protocol URLs)
  return {
    ...result,
    files: result.files.map((file) => ({
      ...file,
      filePath: normalize(file.filePath),
    })),
    errors: result.errors.map((error) => ({
      ...error,
      filePath: normalize(error.filePath),
    })),
  };
}

export async function getPipelines(source: PipelineSource): Promise<GetPipelinesResult> {
  // Handle local sources
  if (source.type === "local") {
    const files = await findPipelineFiles({
      source: { type: "local", cwd: source.cwd },
    });

    const result = await loadPipelinesFromPaths(files);

    const normalize = (filePath: string) =>
      path.relative(source.cwd, filePath).replace(/\\/g, "/");

    return {
      result: {
        ...result,
        files: result.files.map((file) => ({
          ...file,
          filePath: normalize(file.filePath),
        })),
        errors: result.errors.map((error) => ({
          ...error,
          filePath: normalize(error.filePath),
        })),
      },
    };
  }

  // For GitHub/GitLab sources
  const cacheStatus = await getRemoteSourceCacheStatus({
    source: source.type,
    owner: source.owner,
    repo: source.repo,
    ref: source.ref,
  });

  try {
    const result = await loadRemoteSourceFiles(source, cacheStatus);
    return { result };
  } catch (err) {
    if (err instanceof CacheMissError) {
      // Auto-sync the remote source (server is allowed to download directly)
      const syncResult = await syncRemoteSource({
        source: source.type,
        owner: source.owner,
        repo: source.repo,
        ref: source.ref,
      });

      if (!syncResult.success) {
        return {
          result: {
            pipelines: [],
            files: [],
            errors: [],
          },
          cacheError: {
            message: `Failed to sync source: ${syncResult.error?.message ?? "Unknown error"}`,
            source: source.type,
            owner: source.owner,
            repo: source.repo,
            ref: source.ref ?? "HEAD",
          },
        };
      }

      // Retry after successful sync
      const result = await loadRemoteSourceFiles(source, cacheStatus);
      return { result };
    }

    throw err;
  }
}
