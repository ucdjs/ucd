import type { PipelineDefinition } from "@ucdjs/pipelines-core";
import { isPipelineDefinition } from "@ucdjs/pipelines-core";

export interface LoadedPipelineFile {
  /**
   * The file path that was loaded.
   */
  filePath: string;

  /**
   * Pipeline definitions found in the file.
   */
  pipelines: PipelineDefinition[];

  /**
   * Export names that contained pipeline definitions.
   */
  exportNames: string[];
}

export interface LoadPipelinesResult {
  /**
   * All pipeline definitions found across all files.
   */
  pipelines: PipelineDefinition[];

  /**
   * Details about each file that was loaded.
   */
  files: LoadedPipelineFile[];

  /**
   * Files that failed to load.
   */
  errors: Array<PipelineLoadError>;
}

export interface PipelineLoadError {
  filePath: string;
  error: Error;
}

export interface LoadPipelinesOptions {
  /**
   * If true, throw on first error instead of collecting errors.
   * @default false
   */
  throwOnError?: boolean;
}

/**
 * Load a single pipeline file and extract all PipelineDefinition exports.
 *
 * @param {string} filePath - Absolute or relative path to the file to load
 * @returns {Promise<LoadedPipelineFile>} The loaded pipeline file with extracted definitions
 *
 * @example
 * ```ts
 * const result = await loadPipelineFile("./pipelines/my-pipeline.ts");
 * console.log(result.pipelines); // Array of PipelineDefinition
 * ```
 */
export async function loadPipelineFile(filePath: string): Promise<LoadedPipelineFile> {
  console.log(`Loading pipeline file: ${filePath}`);
  const module = await import(filePath);

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

/**
 * Load multiple pipeline files and extract all PipelineDefinition exports.
 *
 * @param {string[]} filePaths - Array of file paths to load
 * @param {LoadPipelinesOptions} options - Loading options
 * @returns Combined result with all pipelines and any errors
 *
 * @example
 * ```ts
 * const result = await loadPipelinesFromPaths([
 *   "./pipelines/blocks.ts",
 *   "./pipelines/scripts.ts",
 * ]);
 *
 * console.log(result.pipelines); // All pipelines from all files
 * console.log(result.errors); // Any files that failed to load
 * ```
 */
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

  // Collect errors instead of throwing; preserve order.
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
