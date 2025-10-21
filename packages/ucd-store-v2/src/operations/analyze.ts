import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../errors";
import type { InternalUCDStoreContext } from "../types";
import { tryCatch } from "@ucdjs-internal/shared";
import { getExpectedFilePaths } from "../core/files";
import { listFiles } from "./files/list";

export interface AnalyzeOptions {
  /**
   * Specific versions to analyze. If not provided, analyzes all versions.
   */
  versions?: string[];
}

export interface VersionAnalysis {
  /**
   * The version analyzed
   */
  version: string;

  /**
   * Whether the version is complete
   * This means all expected files are present and no orphaned files exist.
   * If this is false, it indicates that some files are missing or there are orphaned files.
   */
  isComplete: boolean;

  orphanedFiles: string[];

  /**
   * List of missing files (if any)
   */
  missingFiles: string[];

  /**
   * List of files that were found in the store for this version
   *
   * NOTE:
   * This does not include orphaned files.
   */
  files: string[];

  /**
   * Total number of files expected for this version
   */
  expectedFileCount: number;

  /**
   * Number of files found for this version
   */
  fileCount: number;

  totalSize: string;
  fileTypes: Record<string, number>; // { ".txt": 85, ".html": 10 }
  lastModified?: string;
}

/**
 * Analyzes Unicode data in the store.
 *
 * @param {InternalUCDStoreContext} context - Internal store context
 * @param {AnalyzeOptions} [options] - Analyze options
 * @returns {Promise<OperationResult<AnalysisResult[], StoreError>>} Operation result
 */
export async function analyze(
  context: InternalUCDStoreContext,
  options?: AnalyzeOptions,
): Promise<OperationResult<VersionAnalysis[], StoreError>> {
  let results: VersionAnalysis[] = [];
  return tryCatch(async () => {
    const versionsToAnalyze = options?.versions ?? context.versions;

    const promises = versionsToAnalyze.map(async (version) => {
      // if version not in store, skip
      if (!context.versions.includes(version)) {
        return null;
      }

      // get the expected files for this version
      const expectedFiles = await getExpectedFilePaths(context.client, version);

      // get the actual files from the store
      const [actualFiles, error] = await listFiles(context, version);

      if (error != null) {
        throw error;
      }

      const orphanedFiles: string[] = [];
      const missingFiles: string[] = [];
      const files: string[] = [];
      const fileTypes: Record<string, number> = {};

      const expectedSet = new Set(expectedFiles);
      const actualSet = new Set(actualFiles);
      for (const expectedFile of expectedSet) {
        if (!actualSet.has(expectedFile)) {
          missingFiles.push(expectedFile);
        }
      }

      for (const actualFile of actualSet) {
        const isExpected = expectedSet.has(actualFile);
        if (!isExpected) {
          orphanedFiles.push(actualFile);

          const extMatch = actualFile.match(/\.[^/.]+$/);
          const ext = extMatch ? extMatch[0] : "no_extension";

          fileTypes[ext] ||= 0;
          fileTypes[ext] += 1;

          continue;
        }

        if (isExpected) {
          files.push(actualFile);

          const extMatch = actualFile.match(/\.[^/.]+$/);
          const ext = extMatch ? extMatch[0] : "no_extension";

          fileTypes[ext] ||= 0;
          fileTypes[ext] += 1;
        }
      }

      const isComplete = orphanedFiles.length === 0 && missingFiles.length === 0;
      return {
        version,
        expectedFileCount: expectedFiles.length,
        fileCount: files.length,
        isComplete,
        orphanedFiles,
        missingFiles,
        files,
        totalSize: "N/A",
        fileTypes,
      } satisfies VersionAnalysis;
    });

    results = await Promise.all(promises).then((res) => res.filter((r): r is VersionAnalysis => r !== null));

    return results;
  });
}
