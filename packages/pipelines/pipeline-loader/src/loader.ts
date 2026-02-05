import type { PipelineDefinition } from "@ucdjs/pipelines-core";
import { isPipelineDefinition } from "@ucdjs/pipelines-core";
import { transform } from "oxc-transform";
import type { GitHubSource, GitLabSource, RemoteFileList } from "./remote/types";
import * as github from "./remote/github";
import * as gitlab from "./remote/gitlab";

export interface LoadedPipelineFile {
  filePath: string;
  pipelines: PipelineDefinition[];
  exportNames: string[];
}

export interface LoadPipelinesResult {
  pipelines: PipelineDefinition[];
  files: LoadedPipelineFile[];
  errors: Array<PipelineLoadError>;
}

export interface PipelineLoadError {
  filePath: string;
  error: Error;
}

export interface LoadPipelinesOptions {
  throwOnError?: boolean;
}

export interface LoadPipelineFromContentOptions {
  transformFn?: (code: string, filename: string) => { code: string };
}

export interface FindRemotePipelineFilesOptions {
  pattern?: string;
  fetchFn?: typeof fetch;
}

export interface LoadRemotePipelinesOptions {
  throwOnError?: boolean;
  fetchFn?: typeof fetch;
  transformFn?: (code: string, filename: string) => { code: string };
}

export async function loadPipelineFile(filePath: string): Promise<LoadedPipelineFile> {
  const module = await import(/* @vite-ignore */ filePath);

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
  const errors: Array<PipelineLoadError> = [];

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

export async function loadPipelineFromContent(
  content: string,
  filename: string,
  options: LoadPipelineFromContentOptions = {},
): Promise<LoadedPipelineFile> {
  const { transformFn = (code, fname) => transform(code, fname) } = options;

  const { code: jsCode } = transformFn(content, filename);

  const module = { exports: {} };
  const exports = module.exports;

  const sandbox = {
    module,
    exports,
    require,
    __filename: filename,
    __dirname: filename.split("/").slice(0, -1).join("/"),
  };

  const fn = new Function(
    "module",
    "exports",
    "require",
    "__filename",
    "__dirname",
    jsCode,
  );

  fn.call(module.exports, module, module.exports, require, filename, sandbox.__dirname);

  const pipelines: PipelineDefinition[] = [];
  const exportNames: string[] = [];

  const exportedModule = module.exports as Record<string, unknown>;

  for (const [name, value] of Object.entries(exportedModule)) {
    if (isPipelineDefinition(value)) {
      pipelines.push(value);
      exportNames.push(name);
    }
  }

  if (isPipelineDefinition(module.exports)) {
    pipelines.push(module.exports);
    exportNames.push("default");
  }

  return {
    filePath: filename,
    pipelines,
    exportNames,
  };
}

export async function findRemotePipelineFiles(
  source: GitHubSource | GitLabSource,
  options: FindRemotePipelineFilesOptions = {},
): Promise<RemoteFileList> {
  const { pattern = "**/*.ucd-pipeline.ts", fetchFn = fetch } = options;
  const { owner, repo, ref, path } = source;

  const repoRef = { owner, repo, ref, path };

  let fileList: RemoteFileList;
  if (source.type === "github") {
    fileList = await github.listFiles(repoRef, { fetchFn });
  } else {
    fileList = await gitlab.listFiles(repoRef, { fetchFn });
  }

  const matcher = new RegExp(
    pattern
      .replace(/\*\*/g, ".*")
      .replace(/\*/g, "[^/]*")
      .replace(/\?/g, "."),
  );

  const matchedFiles = fileList.files.filter((file) => matcher.test(file));

  return {
    files: matchedFiles,
    truncated: fileList.truncated,
  };
}

export async function loadRemotePipelines(
  source: GitHubSource | GitLabSource,
  filePaths: string[],
  options: LoadRemotePipelinesOptions = {},
): Promise<LoadPipelinesResult> {
  const { throwOnError = false, fetchFn = fetch, transformFn } = options;
  const { owner, repo, ref, type } = source;

  const repoRef = { owner, repo, ref };

  if (throwOnError) {
    const wrapped = filePaths.map((filePath) =>
      (type === "github"
        ? github.fetchFile(repoRef, filePath, { fetchFn })
        : gitlab.fetchFile(repoRef, filePath, { fetchFn })
      ).then((content) => loadPipelineFromContent(content, filePath, { transformFn })).catch((err) => {
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

  const settled = await Promise.allSettled(
    filePaths.map(async (filePath) => {
      const content = type === "github"
        ? await github.fetchFile(repoRef, filePath, { fetchFn })
        : await gitlab.fetchFile(repoRef, filePath, { fetchFn });
      return loadPipelineFromContent(content, filePath, { transformFn });
    }),
  );

  const files: LoadedPipelineFile[] = [];
  const errors: Array<PipelineLoadError> = [];

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
