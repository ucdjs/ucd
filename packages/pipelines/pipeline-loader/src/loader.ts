import type { PipelineDefinition } from "@ucdjs/pipelines-core";
import { isPipelineDefinition } from "@ucdjs/pipelines-core";

/**
 * Result of loading pipeline definitions from a file.
 */
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

/**
 * Result of loading multiple pipeline files.
 */
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
  errors: Array<{
    filePath: string;
    error: Error;
  }>;
}

/**
 * Options for loading pipelines.
 */
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
 * @param filePath - Absolute or relative path to the file to load
 * @returns The loaded pipeline file with extracted definitions
 *
 * @example
 * ```ts
 * const result = await loadPipelineFile("./pipelines/my-pipeline.ts");
 * console.log(result.pipelines); // Array of PipelineDefinition
 * ```
 */
export async function loadPipelineFile(filePath: string): Promise<LoadedPipelineFile> {
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
 * @param filePaths - Array of file paths to load
 * @param options - Loading options
 * @returns Combined result with all pipelines and any errors
 *
 * @example
 * ```ts
 * const result = await loadPipelines([
 *   "./pipelines/blocks.ts",
 *   "./pipelines/scripts.ts",
 * ]);
 *
 * console.log(result.pipelines); // All pipelines from all files
 * console.log(result.errors); // Any files that failed to load
 * ```
 */
export async function loadPipelines(
  filePaths: string[],
  options: LoadPipelinesOptions = {},
): Promise<LoadPipelinesResult> {
  const { throwOnError = false } = options;

  const pipelines: PipelineDefinition[] = [];
  const files: LoadedPipelineFile[] = [];
  const errors: Array<{ filePath: string; error: Error }> = [];

  for (const filePath of filePaths) {
    try {
      const result = await loadPipelineFile(filePath);
      files.push(result);
      pipelines.push(...result.pipelines);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      if (throwOnError) {
        throw new Error(`Failed to load pipeline file: ${filePath}`, { cause: error });
      }

      errors.push({ filePath, error });
    }
  }

  return {
    pipelines,
    files,
    errors,
  };
}

/**
 * Load pipelines from a directory by matching file patterns.
 * This is a convenience wrapper that combines glob matching with loading.
 *
 * Note: This function requires the caller to provide the resolved file paths.
 * Use a glob library to find files first, then pass them to loadPipelines.
 *
 * @param filePaths - Pre-resolved file paths (use a glob library to find them)
 * @param options - Loading options
 * @returns Combined result with all pipelines
 *
 * @example
 * ```ts
 * import { glob } from "glob";
 *
 * const files = await glob("./pipelines/*.ts");
 * const result = await loadPipelines(files);
 * ```
 */
export { loadPipelines as loadPipelinesFromPaths };
