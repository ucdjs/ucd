import type { PipelineDefinition } from "@ucdjs/pipelines-core";
import type {
  LoadedPipelineFile,
  LoadPipelinesResult,
  PipelineLoadError,
} from "./types";
import { pathToFileURL } from "node:url";
import { isPipelineDefinition } from "@ucdjs/pipelines-core";
import { glob } from "tinyglobby";

export async function loadPipelineFile(filePath: string): Promise<LoadedPipelineFile> {
  const moduleSpecifier = filePath.startsWith("file://")
    ? filePath
    : pathToFileURL(filePath).href;
  const module = await import(/* @vite-ignore */ moduleSpecifier);

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

  cwd?: string;
}

export async function findPipelineFiles(
  options: FindPipelineFilesOptions = {},
): Promise<string[]> {
  let patterns: string[] = ["**/*.ucd-pipeline.ts"];
  // eslint-disable-next-line node/prefer-global/process
  const resolvedCwd = options.cwd ?? process.cwd();

  if (options.patterns) {
    patterns = Array.isArray(options.patterns)
      ? options.patterns
      : [options.patterns];
  }

  return glob(patterns, {
    cwd: resolvedCwd,
    ignore: ["node_modules/**", "**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**"],
    absolute: true,
    onlyFiles: true,
  });
}
