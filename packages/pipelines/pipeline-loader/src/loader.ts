import type { PipelineDefinition } from "@ucdjs/pipelines-core";
import type {
  LoadedPipelineFile,
  LoadPipelinesResult,
  PipelineLoadError,
  PipelineSourceWithoutId,
} from "./types";
import path from "node:path";
import { isPipelineDefinition } from "@ucdjs/pipelines-core";
import { glob } from "tinyglobby";
import { bundle } from "./bundle";
import { getRemoteSourceCacheStatus, writeCacheMarker } from "./cache";
import {
  downloadRemoteSourceArchive,
  materializeArchiveToDir,
  parseRemoteSourceUrl,
} from "./utils";

/**
 * Load a pipeline definition file.
 *
 * @param {string} fileOrRemotePath - The path to the pipeline definition file. Can be a local file path or a remote URL (GitHub/GitLab).
 * @returns {Promise<LoadedPipelineFile>} An object containing the file path, an array of pipeline definitions exported from the file, and their export names.
 * @throws Will throw an error if the file cannot be loaded or if the pipeline definitions are invalid.
 *
 * @example
 * ```typescript
 * // Load a local pipeline file
 * const result = await loadPipelineFile("./pipelines/my-pipeline.ucd-pipeline.ts");
 * console.log(result.pipelines); // Array of pipeline definitions
 *
 * // Load a pipeline file from a GitHub repository
 * const result = await loadPipelineFile("github://owner/repo/path/to/pipeline.ucd-pipeline.ts");
 * console.log(result.pipelines); // Array of pipeline definitions
 *
 * // Load a pipeline file from a GitLab repository
 * const result = await loadPipelineFile("gitlab://owner/repo/path/to/pipeline.ucd-pipeline.ts");
 * console.log(result.pipelines); // Array of pipeline definitions
 * ```
 */
export async function loadPipelineFile(fileOrRemotePath: string): Promise<LoadedPipelineFile> {
  let resolvedPath = path.resolve(fileOrRemotePath);

  const source = parseRemoteSourceUrl(fileOrRemotePath);
  if (source) {
    const status = await getRemoteSourceCacheStatus({
      source: source.type,
      owner: source.owner,
      repo: source.repo,
      ref: source.ref,
    });

    if (!status.cached) {
      const archiveBuffer = await downloadRemoteSourceArchive(source.type, {
        owner: source.owner,
        repo: source.repo,
        ref: source.ref,
        commitSha: status.commitSha,
      });

      await materializeArchiveToDir({
        archiveBuffer,
        targetDir: status.cacheDir,
      });

      await writeCacheMarker(status);
    }

    resolvedPath = path.join(status.cacheDir, source.filePath);
  }

  // Always bundle the file to ensure we can import it with all dependencies
  const { dataUrl } = await bundle(resolvedPath);
  const module = await import(/* @vite-ignore */ dataUrl);

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
    filePath: fileOrRemotePath,
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
   * Optional source configuration to find pipeline files in a local directory or remote repository. If not provided, defaults to searching the current working directory.
   */
  source?: PipelineSourceWithoutId;
}

/**
 * Find pipeline files in a local directory or remote repository.
 *
 * @param {FindPipelineFilesOptions}  [options] - Options to configure the search for pipeline files, including glob patterns and source location (local or remote).
 * @returns {Promise<string[]>} An array of file paths that match the specified patterns and source.
 *
 * @example
 * ```typescript
 * // Local directory
 * findPipelineFiles({ source: { type: "local", cwd: "./pipelines" } })
 *
 * // GitHub repository
 * findPipelineFiles({
 *   source: { type: "github", owner: "ucdjs", repo: "demo-pipelines", ref: "main" }
 * })
 *
 * // GitLab repository
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
      const status = await getRemoteSourceCacheStatus({
        source: source.type,
        owner: source.owner,
        repo: source.repo,
        ref: source.ref,
      });

      if (!status.cached) {
        const archiveBuffer = await downloadRemoteSourceArchive(source.type, {
          owner: source.owner,
          repo: source.repo,
          ref: source.ref ?? "HEAD",
          commitSha: status.commitSha,
        });

        await materializeArchiveToDir({
          archiveBuffer,
          targetDir: status.cacheDir,
        });

        await writeCacheMarker(status);
      }

      cwd = status.cacheDir;
    }
  } else {
    // Default to current working directory
    // eslint-disable-next-line node/prefer-global/process
    cwd = process.cwd();
  }

  return glob(patterns, {
    cwd,
    ignore: ["node_modules/**", "**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**"],
    absolute: true,
    onlyFiles: true,
  });
}
