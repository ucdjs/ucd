import type { PipelineDefinition } from "@ucdjs/pipelines-core";
import type {
  FindPipelineFilesResult,
  LoadedPipelineFile,
  LoadPipelinesResult,
  PipelineLoadError,
  PipelineLoadErrorCode,
  PipelineSourceWithoutId,
} from "./types";
import path from "node:path";
import process from "node:process";
import { isPipelineDefinition } from "@ucdjs/pipelines-core";
import { glob } from "tinyglobby";
import { bundle } from "./bundle";
import { getRemoteSourceCacheStatus } from "./cache";
import { BundleError, BundleResolveError, BundleTransformError, CacheMissError } from "./errors";
import { parseRemoteSourceUrl } from "./utils";

/**
 * Load a pipeline definition file.
 *
 * For remote sources (GitHub/GitLab), the source must be synced to the cache first
 * using `ucd pipelines cache refresh` or the syncRemoteSource() function.
 *
 * @param {string} fileOrRemotePath - The path to the pipeline definition file. Can be a local file path or a remote URL (GitHub/GitLab).
 * @returns {Promise<LoadedPipelineFile>} An object containing the file path, an array of pipeline definitions exported from the file, and their export names.
 * @throws {CacheMissError} If the remote source is not in the cache.
 * @throws Will throw an error if the file cannot be loaded or if the pipeline definitions are invalid.
 *
 * @example
 * ```typescript
 * // Load a local pipeline file
 * const result = await loadPipelineFile("./pipelines/my-pipeline.ucd-pipeline.ts");
 * console.log(result.pipelines); // Array of pipeline definitions
 *
 * // Load a pipeline file from a cached GitHub repository
 * // (requires: ucd pipelines cache refresh --github owner/repo --ref main)
 * const result = await loadPipelineFile("github://owner/repo?ref=main&path=pipelines/my-pipeline.ucd-pipeline.ts");
 * console.log(result.pipelines); // Array of pipeline definitions
 * ```
 */
export async function loadPipelineFile(fileOrRemotePath: string): Promise<LoadedPipelineFile> {
  let resolvedPath = path.resolve(fileOrRemotePath);
  let cwd = process.cwd();
  let sourceFilePath: string | undefined;

  const source = parseRemoteSourceUrl(fileOrRemotePath);
  if (source) {
    // Check cache status (no API calls - just reads local cache)
    const status = await getRemoteSourceCacheStatus({
      source: source.type,
      owner: source.owner,
      repo: source.repo,
      ref: source.ref,
    });

    if (!status.cached) {
      throw new CacheMissError(source.type, source.owner, source.repo, source.ref);
    }

    cwd = status.cacheDir;
    // For remote sources: resolvedPath is the absolute local path in cache
    resolvedPath = path.join(status.cacheDir, source.filePath);
    // sourceFilePath is the original URL
    sourceFilePath = fileOrRemotePath;
  }

  // Always bundle the file to ensure we can import it with all dependencies
  const bundleResult = await bundle({
    entryPath: resolvedPath,
    cwd,
  });

  const module = await import(/* @vite-ignore */ bundleResult.dataUrl);

  const pipelines: PipelineDefinition[] = [];
  const exportNames: string[] = [];

  for (const [name, value] of Object.entries(module)) {
    // Skip default exports - only process named exports
    if (name === "default") continue;
    if (isPipelineDefinition(value)) {
      pipelines.push(value);
      exportNames.push(name);
    }
  }

  return {
    filePath: resolvedPath,
    sourceFilePath,
    pipelines,
    exportNames,
  };
}

export interface FindPipelineFilesOptions {
  /**
   * Glob pattern(s) to match pipeline files. Defaults to "**\/*.ucd-pipeline.ts".
   */
  patterns?: string | string[];

  /**
   * Optional source configuration to find pipeline files in a local directory or remote repository.
   * For remote repositories, the source must be synced to the cache first.
   * If not provided, defaults to searching the current working directory.
   */
  source?: PipelineSourceWithoutId;
}

/**
 * Find pipeline files in a local directory or remote repository.
 *
 * For remote sources (GitHub/GitLab), the source must be synced to the cache first
 * using `ucd pipelines cache refresh` or the syncRemoteSource() function.
 *
 * @param {FindPipelineFilesOptions}  [options] - Options to configure the search for pipeline files, including glob patterns and source location (local or remote).
 * @returns {Promise<FindPipelineFilesResult>} An object with `files` (matched paths) and `errors` (any discovery errors, e.g. cache miss).
 *
 * @example
 * ```typescript
 * // Local directory
 * const { files } = await findPipelineFiles({ source: { type: "local", cwd: "./pipelines" } })
 *
 * // GitHub repository (requires sync first)
 * const { files, errors } = await findPipelineFiles({
 *   source: { type: "github", owner: "ucdjs", repo: "demo-pipelines", ref: "main" }
 * })
 * ```
 */
export async function findPipelineFiles(
  options: FindPipelineFilesOptions = {},
): Promise<FindPipelineFilesResult> {
  let patterns: string[] = ["**/*.ucd-pipeline.ts"];

  if (options.patterns) {
    patterns = Array.isArray(options.patterns)
      ? options.patterns
      : [options.patterns];
  }

  // Determine the directory to search
  let cwd: string;

  if (options.source) {
    const source = options.source;
    if (source.type === "local") {
      cwd = source.cwd;
    } else {
      // Check cache status (no API calls - just reads local cache)
      const status = await getRemoteSourceCacheStatus({
        source: source.type,
        owner: source.owner,
        repo: source.repo,
        ref: source.ref,
      });

      if (!status.cached) {
        const err = new CacheMissError(source.type, source.owner, source.repo, source.ref ?? "HEAD");
        return {
          files: [],
          errors: [
            {
              code: "CACHE_MISS",
              scope: "source",
              message: err.message,
              cause: err,
              meta: {
                source: source.type,
                owner: source.owner,
                repo: source.repo,
                ref: source.ref ?? "HEAD",
              },
            },
          ],
        };
      }

      cwd = status.cacheDir;
    }
  } else {
    // Default to current working directory
    cwd = process.cwd();
  }

  const files = await glob(patterns, {
    cwd,
    ignore: ["node_modules/**", "**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**"],
    absolute: true,
    onlyFiles: true,
  });

  return { files, errors: [] };
}

function classifyPipelineLoadErrorCode(error: Error): PipelineLoadErrorCode {
  if (error instanceof CacheMissError) {
    return "CACHE_MISS";
  }

  if (error instanceof BundleResolveError) {
    return "BUNDLE_RESOLVE_FAILED";
  }

  if (error instanceof BundleTransformError) {
    return "BUNDLE_TRANSFORM_FAILED";
  }

  if (error instanceof BundleError) {
    return "BUNDLE_FAILED";
  }

  const message = error.message.toLowerCase();

  if (message.includes("failed to bundle pipeline file") || message.includes("failed to bundle module")) {
    return "BUNDLE_FAILED";
  }

  if (message.includes("failed to load pipeline file")) {
    return "IMPORT_FAILED";
  }

  return "UNKNOWN";
}

function buildErrorMeta(error: Error): Record<string, unknown> | undefined {
  if (error instanceof CacheMissError) {
    return {
      source: error.source,
      owner: error.owner,
      repo: error.repo,
      ref: error.ref,
    };
  }

  if (error instanceof BundleResolveError) {
    return {
      entryPath: error.entryPath,
      importPath: error.importPath,
    };
  }

  if (error instanceof BundleTransformError) {
    return {
      entryPath: error.entryPath,
      ...(error.line != null ? { line: error.line } : {}),
      ...(error.column != null ? { column: error.column } : {}),
    };
  }

  if (error instanceof BundleError) {
    return {
      entryPath: error.entryPath,
    };
  }

  return undefined;
}

export async function loadPipelinesFromPaths(
  filePaths: string[],
): Promise<LoadPipelinesResult> {
  const settled = await Promise.allSettled(filePaths.map((fp) => loadPipelineFile(fp)));

  const files: LoadedPipelineFile[] = [];
  const errors: PipelineLoadError[] = [];

  for (const [i, result] of settled.entries()) {
    if (result.status === "fulfilled") {
      files.push(result.value);
      continue;
    }

    const error = result.reason instanceof Error
      ? result.reason
      : new Error(String(result.reason));

    const filePath = filePaths[i]!;
    const code = classifyPipelineLoadErrorCode(error);

    errors.push({
      code,
      scope: "file",
      message: error.message,
      filePath,
      cause: error,
      meta: buildErrorMeta(error),
    });
  }

  const pipelines = files.flatMap((f) => f.pipelines);

  return {
    pipelines,
    files,
    errors,
  };
}
