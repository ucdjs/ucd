import { glob } from "tinyglobby";

/**
 * Find pipeline files on disk.
 *
 * By default matches files named `*.ucd-pipeline.ts` (the repository standard).
 *
 * @param {string | string[]} patterns glob string or array of glob strings
 * @param {string} cwd optional working directory (defaults to process.cwd())
 */
export async function findPipelineFiles(
  patterns: string | string[] = ["**/*.ucd-pipeline.ts"],
  cwd?: string,
): Promise<string[]> {
  const p = Array.isArray(patterns) ? patterns : [patterns];

  return glob(p, {
    // eslint-disable-next-line node/prefer-global/process
    cwd: cwd ?? process.cwd(),
    ignore: ["node_modules/**", "**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**"],
    absolute: true,
    onlyFiles: true,
  });
}
