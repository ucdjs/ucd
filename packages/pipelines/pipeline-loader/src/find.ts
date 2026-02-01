import { glob } from "tinyglobby";

export interface FindPipelineFilesOptions {
  /**
   * Glob patterns to match pipeline files.
   * Defaults to `**\/*.ucd-pipeline.ts`
   */
  patterns?: string | string[];

  /**
   * Current working directory to resolve patterns against.
   * Defaults to `process.cwd()`
   */
  cwd?: string;
}

/**
 * Find pipeline files on disk.
 *
 * By default matches files named `*.ucd-pipeline.ts` (the repository standard).
 *
 * @param {FindPipelineFilesOptions} options options for finding pipeline files
 * @returns {Promise<string[]>} Array of matched file paths
 *
 * @example
 * ```ts
 * const files = await findPipelineFiles({ cwd: "./pipelines" });
 * console.log(files); // Array of file paths
 * ```
 */
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
