import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../types";
import { createDebugger, wrapTry } from "@ucdjs-internal/shared";
import { listFiles } from "../files/list";

const debug = createDebugger("ucdjs:ucd-store:analyze");

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
 * @this {InternalUCDStoreContext} - Internal store context with client, filters, FS bridge, and configuration
 * @param {AnalyzeOptions} [options] - Analyze options
 * @returns {Promise<OperationResult<Map<string, AnalysisReport>, StoreError>>} Operation result
 */
async function _analyze(
  this: InternalUCDStoreContext,
  options?: AnalyzeOptions,
): Promise<OperationResult<Map<string, AnalysisReport>, StoreError>> {
  const results = new Map<string, AnalysisReport>();

  return wrapTry(async () => {
    const versionsToAnalyze = options?.versions ?? this.versions.resolved;

    const promises = versionsToAnalyze.map(async (version) => {
      // If version not in store, skip
      if (!this.versions.resolved.includes(version)) {
        return null;
      }

      const expectedFiles = await this.getExpectedFilePaths(version);
      debug?.("Found expected files while analyzing: %O", expectedFiles);

      // Get files from store
      // Use allowApi: true to support HTTP bridge (read-only stores)
      let [actualFiles, error] = await listFiles(this, version, {
        allowApi: false,
        filters: options?.filters,
      });

      if (error != null) {
        throw error;
      }

      // Filter out the snapshot.json, since it is not expected to be there.
      actualFiles = (actualFiles || []).filter((file) => file !== "snapshot.json");

      debug?.("Actual files while analyzing: %O", actualFiles);

      const expectedSet = new Set(expectedFiles);
      const actualSet = new Set(actualFiles);

      const files: string[] = [];
      const orphanedFiles: string[] = [];
      const missingFiles: string[] = [];
      const fileTypes: Record<string, number> = {};

      debug?.("Started analyzing files");

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

      debug?.("Finished analyzing files");

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

function isContext(obj: any): obj is InternalUCDStoreContext {
  return !!obj && typeof obj === "object" && Array.isArray(obj.versions?.resolved);
}

export function analyze(
  context: InternalUCDStoreContext,
  options?: AnalyzeOptions,
): Promise<OperationResult<Map<string, AnalysisReport>, StoreError>>;

export function analyze(
  this: InternalUCDStoreContext,
  options?: AnalyzeOptions,
): Promise<OperationResult<Map<string, AnalysisReport>, StoreError>>;

export function analyze(this: any, thisOrContext: any, options?: any): Promise<OperationResult<Map<string, AnalysisReport>, StoreError>> {
  if (isContext(thisOrContext)) {
    return _analyze.call(thisOrContext, options);
  }

  return _analyze.call(this, thisOrContext);
}

function getExtension(filePath: string): string {
  const match = filePath.match(/\.[^/.]+$/);
  return match ? match[0] : "no_extension";
}
