import type { PipelineDefinition } from "@ucdjs/pipelines-core";
import type {
  GitHubSource,
  GitLabSource,
  LoadedPipelineFile,
  LoadPipelinesResult,
  LocalSource,
  PipelineLoadError,
} from "./types";
import path from "node:path";
import { isPipelineDefinition } from "@ucdjs/pipelines-core";
import { glob } from "tinyglobby";
import { bundleModule, createDataUrl } from "./bundle";
import { downloadGitHubRepo } from "./cache/github";
import { downloadGitLabRepo } from "./cache/gitlab";

// Simplified source types for findPipelineFiles (id is not required)
export type FindPipelineSource
  = | { type: "local"; cwd: string }
    | { type: "github"; owner: string; repo: string; ref?: string; path?: string }
    | { type: "gitlab"; owner: string; repo: string; ref?: string; path?: string };

/**
 * Parse a github:// or gitlab:// URL
 */
function parseRepoUrl(url: string): { type: "github" | "gitlab"; owner: string; repo: string; ref: string; filePath: string } | null {
  if (url.startsWith("github://")) {
    const match = url.match(/^github:\/\/([^/]+)\/([^?]+)\?ref=([^&]+)&path=(.+)$/);
    if (match && match[1] && match[2] && match[3] && match[4]) {
      return {
        type: "github",
        owner: match[1],
        repo: match[2],
        ref: match[3],
        filePath: match[4],
      };
    }
  }

  if (url.startsWith("gitlab://")) {
    const match = url.match(/^gitlab:\/\/([^/]+)\/([^?]+)\?ref=([^&]+)&path=(.+)$/);
    if (match && match[1] && match[2] && match[3] && match[4]) {
      return {
        type: "gitlab",
        owner: match[1],
        repo: match[2],
        ref: match[3],
        filePath: match[4],
      };
    }
  }

  return null;
}

/**
 * Load a pipeline file from a local path or remote URL.
 *
 * Supports:
 * - Local file paths
 * - github://owner/repo?ref=branch&path=file.ts
 * - gitlab://owner/repo?ref=branch&path=file.ts
 */
export async function loadPipelineFile(filePath: string): Promise<LoadedPipelineFile> {
  let resolvedPath: string;

  // Check if it's a remote URL
  const repoInfo = parseRepoUrl(filePath);
  if (repoInfo) {
    const cacheDir = repoInfo.type === "github"
      ? await downloadGitHubRepo({ owner: repoInfo.owner, repo: repoInfo.repo, ref: repoInfo.ref })
      : await downloadGitLabRepo({ owner: repoInfo.owner, repo: repoInfo.repo, ref: repoInfo.ref });

    resolvedPath = path.join(cacheDir, repoInfo.filePath);
  } else {
    resolvedPath = path.resolve(filePath);
  }

  // Always bundle (handles TypeScript and relative imports)
  const bundle = await bundleModule(resolvedPath);
  const dataUrl = createDataUrl(bundle);
  const module = await import(/* @vite-ignore */ dataUrl);

  const pipelines: PipelineDefinition[] = [];
  const exportNames: string[] = [];

  for (const [name, value] of Object.entries(module)) {
    if (isPipelineDefinition(value)) {
      pipelines.push(value);
      exportNames.push(name);
    }
  }

  return {
    filePath,
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
  patterns?: string | string[];
  source?: FindPipelineSource;
}

/**
 * Find pipeline files in a local directory or remote repository.
 *
 * Examples:
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
    } else if (source.type === "github") {
      cwd = await downloadGitHubRepo({ owner: source.owner, repo: source.repo, ref: source.ref });
    } else {
      cwd = await downloadGitLabRepo({ owner: source.owner, repo: source.repo, ref: source.ref });
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
