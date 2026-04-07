import type { PipelineDefinition } from "@ucdjs/pipeline-core";
import type { BundleOptions, BundleResult } from "./bundle";
import type { PipelineLoaderIssue } from "./errors";
import path from "node:path";
import { isPipelineDefinition } from "@ucdjs/pipeline-core";
import { bundle } from "./bundle";
import { toPipelineLoaderIssue } from "./errors";

export interface LoadedPipelineFile {
  filePath: string;
  pipelines: PipelineDefinition[];
  exportNames: string[];
  issues: PipelineLoaderIssue[];
}

export interface LoadPipelinesResult {
  pipelines: PipelineDefinition[];
  files: LoadedPipelineFile[];
  issues: PipelineLoaderIssue[];
}

export interface LoadPipelineFileOptions {
  filePath: string;
  bundleOptions?: BundleOptions["buildOptions"];
}

function createInvalidExportIssue(filePath: string, exportNames: string[]): PipelineLoaderIssue {
  return {
    code: "INVALID_EXPORT",
    scope: "import",
    message: "No named PipelineDefinition exports found.",
    filePath,
    meta: {
      exportNames,
    },
  };
}

export async function loadPipelineFile(filePath: string): Promise<LoadedPipelineFile>;
export async function loadPipelineFile(options: LoadPipelineFileOptions): Promise<LoadedPipelineFile>;
export async function loadPipelineFile(filePathOrOptions: string | LoadPipelineFileOptions): Promise<LoadedPipelineFile> {
  const filePath = typeof filePathOrOptions === "string" ? filePathOrOptions : filePathOrOptions.filePath;
  const bundleOptions = typeof filePathOrOptions === "string" ? undefined : filePathOrOptions.bundleOptions;

  let bundleResult: BundleResult;
  try {
    bundleResult = await bundle({
      entryPath: filePath,
      cwd: path.dirname(filePath),
      buildOptions: bundleOptions,
    });
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    return {
      filePath,
      pipelines: [],
      exportNames: [],
      issues: [toPipelineLoaderIssue(cause, filePath)],
    };
  }

  let module: Record<string, unknown>;
  try {
    module = await import(/* @vite-ignore */ bundleResult.dataUrl);
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    return {
      filePath,
      pipelines: [],
      exportNames: [],
      issues: [toPipelineLoaderIssue(cause, filePath)],
    };
  }

  const pipelines: PipelineDefinition[] = [];
  const exportNames: string[] = [];

  for (const [name, value] of Object.entries(module)) {
    if (name === "default") continue;
    if (isPipelineDefinition(value)) {
      pipelines.push(value);
      exportNames.push(name);
    }
  }

  return {
    filePath,
    pipelines,
    exportNames,
    issues: pipelines.length === 0 ? [createInvalidExportIssue(filePath, exportNames)] : [],
  };
}

export interface LoadPipelinesFromPathsOptions {
  filePaths: string[];
  bundleOptions?: BundleOptions["buildOptions"];
}

export async function loadPipelinesFromPaths(filePaths: string[]): Promise<LoadPipelinesResult>;
export async function loadPipelinesFromPaths(options: LoadPipelinesFromPathsOptions): Promise<LoadPipelinesResult>;
export async function loadPipelinesFromPaths(filePathsOrOptions: string[] | LoadPipelinesFromPathsOptions): Promise<LoadPipelinesResult> {
  const filePaths = Array.isArray(filePathsOrOptions) ? filePathsOrOptions : filePathsOrOptions.filePaths;
  const bundleOptions = Array.isArray(filePathsOrOptions) ? undefined : filePathsOrOptions.bundleOptions;

  const files = await Promise.all(filePaths.map((filePath) => loadPipelineFile({ filePath, bundleOptions })));
  const issues = files.flatMap((file) => file.issues);

  return {
    pipelines: files.flatMap((file) => file.pipelines),
    files,
    issues,
  };
}
