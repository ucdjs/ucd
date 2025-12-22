import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../types";
import { wrapTry } from "@ucdjs-internal/shared";
import { getExpectedFilePaths } from "../core/files";
import { listFiles } from "./files/list";

export interface AnalyzeOptions extends SharedOperationOptions {
  /**
   * Specific versions to analyze. If not provided, analyzes all versions.
   */
  versions?: string[];
}

export interface AnalysisFilesReport {
  /**
   * List of files that were found in the store for this version
   *
   * NOTE:
   * This does not include orphaned files.
   */
  present: readonly string[];

  /**
   * List of orphaned files
   */
  orphaned: readonly string[];

  /**
   * List of files missing from the store
   */
  missing: readonly string[];
}

export interface AnalysisCountsReport {
  /**
   * Total number of files expected for this version
   */
  expected: number;

  /**
   * Number of files found in the store for this version
   */
  present: number;

  /**
   * Number of orphaned files for this version
   */
  orphaned: number;

  /**
   * Number of missing files for this version
   */
  missing: number;
}

export interface AnalysisReport {
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

  files: AnalysisFilesReport;

  counts: AnalysisCountsReport;

  /**
   * Breakdown of file types by extension
   *
   * This provides insight into the composition of files within the version.
   */
  fileTypes: Record<string, number>;
}

/**
 * Analyzes Unicode data in the store.
 *
 * @param {InternalUCDStoreContext} context - Internal store context
 * @param {AnalyzeOptions} [options] - Analyze options
 * @returns {Promise<OperationResult<Map<string, AnalysisReport>, StoreError>>} Operation result
 */
export async function analyze(
  context: InternalUCDStoreContext,
  options?: AnalyzeOptions,
): Promise<OperationResult<Map<string, AnalysisReport>, StoreError>> {
  const results = new Map<string, AnalysisReport>();

  return wrapTry(async () => {
    const versionsToAnalyze = options?.versions ?? context.versions;

    const promises = versionsToAnalyze.map(async (version) => {
      // If version not in store, skip
      if (!context.versions.includes(version)) {
        return null;
      }

      const expectedFiles = await getExpectedFilePaths(context.client, version);

      // Get files from store
      // Use allowApi: true to support HTTP bridge (read-only stores)
      const [actualFiles, error] = await listFiles(context, version, {
        allowApi: true,
        filters: options?.filters,
      });

      if (error != null) {
        throw error;
      }

      const expectedSet = new Set(expectedFiles);
      const actualSet = new Set(actualFiles);

      const files: string[] = [];
      const orphanedFiles: string[] = [];
      const missingFiles: string[] = [];
      const fileTypes: Record<string, number> = {};

      for (const actualFile of actualSet) {
        const ext = getExtension(actualFile);
        fileTypes[ext] ??= 0;
        fileTypes[ext] += 1;

        if (expectedSet.has(actualFile)) {
          files.push(actualFile);
        } else {
          orphanedFiles.push(actualFile);
        }
      }

      for (const expectedFile of expectedSet) {
        if (!actualSet.has(expectedFile)) {
          missingFiles.push(expectedFile);
        }
      }

      const isComplete = orphanedFiles.length === 0 && missingFiles.length === 0;

      return {
        version,
        isComplete,
        files: {
          present: Object.freeze(files),
          orphaned: Object.freeze(orphanedFiles),
          missing: Object.freeze(missingFiles),
        },
        counts: {
          get expected() {
            return expectedFiles.length;
          },
          get present() {
            return files.length;
          },
          get orphaned() {
            return orphanedFiles.length;
          },
          get missing() {
            return missingFiles.length;
          },
        },
        fileTypes,
      } satisfies AnalysisReport;
    });

    for await (const report of promises) {
      if (report == null) {
        continue;
      }

      results.set(report.version, report);
    }

    return results;
  });
}

function getExtension(filePath: string): string {
  const match = filePath.match(/\.[^/.]+$/);
  return match ? match[0] : "no_extension";
}
