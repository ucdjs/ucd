import type { PipelineDefinition } from "@ucdjs/pipelines-core";
import type {
  LoadedPipelineFile,
  LoadPipelinesResult,
  PipelineLoadError,
  PipelineSourceWithoutId,
} from "./types";
import path from "node:path";
import process from "node:process";
import { isPipelineDefinition } from "@ucdjs/pipelines-core";
import { glob } from "tinyglobby";
import { bundle } from "./bundle";
import { getRemoteSourceCacheStatus } from "./cache";
import { parseRemoteSourceUrl } from "./utils";

export class CacheMissError extends Error {
  source: string;
  owner: string;
  repo: string;
  ref: string;

  constructor(
    source: string,
    owner: string,
    repo: string,
    ref: string,
  ) {
    super(
      `Cache miss for ${source}:${owner}/${repo}@${ref}. `
      + `Run 'ucd pipelines cache refresh --${source} ${owner}/${repo} --ref ${ref}' to sync.`,
    );
    this.name = "CacheMissError";
    this.source = source;
    this.owner = owner;
    this.repo = repo;
    this.ref = ref;
  }
}

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

  let bundleResult: { dataUrl: string };
  try {
    // Always bundle the file to ensure we can import it with all dependencies
    bundleResult = await bundle({
      entryPath: resolvedPath,
      cwd,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    throw new Error(`Failed to bundle pipeline file: ${fileOrRemotePath}`, { cause: error });
  }

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

export interface LoadPipelinesOptions {
  throwOnError?: boolean;
}

export async function loadPipelinesFromPaths(
  filePaths: string[],
  options: LoadPipelinesOptions = {},
): Promise<LoadPipelinesResult> {
  const { throwOnError = false } = options;

  if (throwOnError) {
    const wrapped = filePaths.map((filePath) =>
      loadPipelineFile(filePath).catch((err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        throw new Error(`Failed to load pipeline file: ${filePath}`, { cause: error });
      }),
    );

    const results = await Promise.all(wrapped);
    const pipelines = results.flatMap((r) => r.pipelines);

    return {
      pipelines,
      files: results,
      errors: [],
    };
  }

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
    errors.push({ filePath: filePaths[i]!, error });
  }

  const pipelines = files.flatMap((f) => f.pipelines);

  return {
    pipelines,
    files,
    errors,
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
 * @returns {Promise<string[]>} An array of file paths that match the specified patterns and source.
 * @throws {CacheMissError} If the remote source is not in the cache.
 *
 * @example
 * ```typescript
 * // Local directory
 * findPipelineFiles({ source: { type: "local", cwd: "./pipelines" } })
 *
 * // GitHub repository (requires sync first)
 * findPipelineFiles({
 *   source: { type: "github", owner: "ucdjs", repo: "demo-pipelines", ref: "main" }
 * })
 *
 * // GitLab repository (requires sync first)
 * findPipelineFiles({
 *   source: { type: "gitlab", owner: "mygroup", repo: "demo", ref: "main" }
 * })
 * ```
 */
export async function findPipelineFiles(
  options: FindPipelineFilesOptions = {},
): Promise<string[]> {
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
        throw new CacheMissError(source.type, source.owner, source.repo, source.ref ?? "HEAD");
      }

      cwd = status.cacheDir;
    }
  } else {
    // Default to current working directory
    cwd = process.cwd();
  }

  return glob(patterns, {
    cwd,
    ignore: ["node_modules/**", "**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**"],
    absolute: true,
    onlyFiles: true,
  });
}
