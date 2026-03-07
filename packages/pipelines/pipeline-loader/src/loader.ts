import type { PipelineDefinition } from "@ucdjs/pipelines-core";
import type { PipelineLoaderIssue } from "./errors";
import path from "node:path";
import { isPipelineDefinition } from "@ucdjs/pipelines-core";
import { bundle } from "./bundle";
import { PipelineLoaderError, toPipelineLoaderIssue } from "./errors";

export interface LoadedPipelineFile {
  filePath: string;
  pipelines: PipelineDefinition[];
  exportNames: string[];
}

export interface LoadPipelinesResult {
  pipelines: PipelineDefinition[];
  files: LoadedPipelineFile[];
  issues: PipelineLoaderIssue[];
}

export async function loadPipelineFile(filePath: string): Promise<LoadedPipelineFile> {
  const bundleResult = await bundle({
    entryPath: filePath,
    cwd: path.dirname(filePath),
  });

  let module: Record<string, unknown>;
  try {
    module = await import(/* @vite-ignore */ bundleResult.dataUrl);
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    throw new PipelineLoaderError("IMPORT_FAILED", `Failed to import ${filePath}: ${cause.message}`, {
      cause,
    });
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
  };
}

export async function loadPipelinesFromPaths(filePaths: string[]): Promise<LoadPipelinesResult> {
  const settled = await Promise.allSettled(filePaths.map((filePath) => loadPipelineFile(filePath)));

  const files: LoadedPipelineFile[] = [];
  const issues: PipelineLoaderIssue[] = [];

  for (const [index, result] of settled.entries()) {
    if (result.status === "fulfilled") {
      files.push(result.value);
      continue;
    }

    const cause = result.reason instanceof Error
      ? result.reason
      : new Error(String(result.reason));

    issues.push(toPipelineLoaderIssue(cause, filePaths[index]!));
  }

  return {
    pipelines: files.flatMap((file) => file.pipelines),
    files,
    issues,
  };
}
