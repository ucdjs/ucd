import type { StoreError } from "../errors";
import type {
  BaseOperationReport,
  BaseVersionReport,
  FileCounts,
  InternalUCDStoreContext,
  OperationMetrics,
  ReportError,
  ReportFile,
  SharedOperationOptions,
} from "../types";
import type { OperationResult } from "@ucdjs-internal/shared";
import type { ExpectedFile } from "@ucdjs/schemas";
import { prependLeadingSlash } from "@luxass/utils";
import { createDebugger, wrapTry } from "@ucdjs-internal/shared";
import { isUCDStoreInternalContext } from "../context";
import { listFiles } from "../files/list";
import {
  computeMetrics,
  createSummaryFromVersionReports,
} from "../utils/reports";

const debug = createDebugger("ucdjs:ucd-store:analyze");

export interface AnalyzeOptions extends SharedOperationOptions {
  /**
   * Specific versions to analyze. If not provided, analyzes all versions.
   */
  versions?: string[];
}

export interface AnalysisFilesReport {
  /**
   * List of files that were found in the store for this version.
   * NOTE: This does not include orphaned files.
   */
  present: ReportFile[];

  /**
   * List of orphaned files (in store but not expected).
   */
  orphaned: ReportFile[];

  /**
   * List of files missing from the store.
   */
  missing: ReportFile[];
}

export interface AnalysisVersionReport extends BaseVersionReport {
  /**
   * Whether the version is complete.
   * True if all expected files are present and no orphaned files exist.
   */
  isComplete: boolean;

  /**
   * Categorized file lists.
   */
  files: AnalysisFilesReport;

  /**
   * Breakdown of file types by extension.
   * Provides insight into the composition of files within the version.
   */
  fileTypes: Record<string, number>;
}

export interface AnalysisReport extends BaseOperationReport {
  /**
   * Per-version analysis results.
   */
  versions: Map<string, AnalysisVersionReport>;
}

/**
 * Analyzes Unicode data in the store.
 *
 * @this {InternalUCDStoreContext} - Internal store context with client, filters, FS bridge, and configuration
 * @param {AnalyzeOptions} [options] - Analyze options
 * @returns {Promise<OperationResult<AnalysisReport, StoreError>>} Operation result
 */
async function _analyze(
  this: InternalUCDStoreContext,
  options?: AnalyzeOptions,
): Promise<OperationResult<AnalysisReport, StoreError>> {
  return wrapTry(async () => {
    const startTime = Date.now();
    const versionReports = new Map<string, AnalysisVersionReport>();

    const versionsToAnalyze = options?.versions ?? this.versions.resolved;

    // Process versions sequentially to avoid race conditions
    for (const version of versionsToAnalyze) {
      // If version not in store, skip
      if (!this.versions.resolved.includes(version)) {
        continue;
      }

      const versionStartTime = Date.now();
      const errors: ReportError[] = [];

      let expectedFiles: ExpectedFile[] = [];
      try {
        expectedFiles = await this.getExpectedFilePaths(version);

        debug?.("Found expected files while analyzing: %O", expectedFiles.map((f) => f.storePath));
      } catch (err) {
        errors.push({
          name: "expected-files",
          filePath: prependLeadingSlash(version),
          reason: err instanceof Error ? err.message : String(err),
        });
      }

      // Get files from store
      // Use allowApi: false since analyze is for local store analysis
      let [actualFilePaths, listFilesError] = await listFiles(this, version, {
        allowApi: false,
        filters: options?.filters,
      });

      if (listFilesError != null) {
        errors.push({
          name: "list-files",
          filePath: prependLeadingSlash(version),
          reason: listFilesError.message,
        });
        actualFilePaths = [];
      }

      // Filter out the snapshot.json, since it is not expected to be there.
      actualFilePaths = (actualFilePaths || []).filter((filePath) => !filePath.endsWith("snapshot.json"));
      debug?.("Actual files while analyzing: %O", actualFilePaths);

      // Use storePath for comparison since that matches the listFiles output format
      const expectedStorePathsSet = new Set(expectedFiles.map((f) => f.storePath));
      const actualFilePathsSet = new Set(actualFilePaths);

      // Create a lookup map from storePath to ExpectedFile for report generation
      const expectedFilesByStorePath = new Map(expectedFiles.map((f) => [f.storePath, f]));

      const presentFiles: ReportFile[] = [];
      const orphanedFiles: ReportFile[] = [];
      const missingFiles: ReportFile[] = [];
      const fileTypes: Record<string, number> = {};

      debug?.("Started analyzing files");

      for (const actualFile of actualFilePathsSet) {
        const ext = getExtension(actualFile);
        fileTypes[ext] ??= 0;
        fileTypes[ext] += 1;

        if (expectedStorePathsSet.has(actualFile)) {
          // File is expected and present
          const expectedFile = expectedFilesByStorePath.get(actualFile);
          presentFiles.push({
            name: expectedFile?.name || actualFile.split("/").pop() || actualFile,
            filePath: actualFile,
          });
        } else {
          // File is in store but not expected (orphaned)
          orphanedFiles.push({
            name: actualFile.split("/").pop() || actualFile,
            filePath: actualFile,
          });
        }
      }

      for (const expectedFile of expectedFiles) {
        if (!actualFilePathsSet.has(expectedFile.storePath)) {
          // File is expected but missing from store
          missingFiles.push({
            name: expectedFile.name,
            filePath: expectedFile.storePath,
          });
        }
      }

      debug?.("Finished analyzing files");

      // Sort file lists for deterministic output
      presentFiles.sort((a, b) => a.name.localeCompare(b.name));
      orphanedFiles.sort((a, b) => a.name.localeCompare(b.name));
      missingFiles.sort((a, b) => a.name.localeCompare(b.name));

      const isComplete = orphanedFiles.length === 0 && missingFiles.length === 0 && errors.length === 0;

      // Build counts using the unified FileCounts structure
      const totalFiles = expectedFiles.length;
      const counts: FileCounts = {
        total: totalFiles,
        success: presentFiles.length,
        skipped: orphanedFiles.length, // orphaned files are "skipped" in analysis context
        failed: missingFiles.length, // missing files are "failed" in analysis context
      };

      const versionDuration = Date.now() - versionStartTime;
      const metrics: OperationMetrics = computeMetrics(counts, versionDuration);

      const versionReport: AnalysisVersionReport = {
        version,
        isComplete,
        files: {
          present: presentFiles,
          orphaned: orphanedFiles,
          missing: missingFiles,
        },
        counts,
        metrics,
        errors,
        fileTypes,
      };

      versionReports.set(version, versionReport);
    }

    const duration = Date.now() - startTime;

    // Create summary from version reports
    // For analyze, we don't track storage size, so use 0
    const summary = createSummaryFromVersionReports(versionReports, duration, 0);

    return {
      timestamp: new Date().toISOString(),
      versions: versionReports,
      summary,
    };
  });
}

export function analyze(
  context: InternalUCDStoreContext,
  options?: AnalyzeOptions,
): Promise<OperationResult<AnalysisReport, StoreError>>;

export function analyze(
  this: InternalUCDStoreContext,
  options?: AnalyzeOptions,
): Promise<OperationResult<AnalysisReport, StoreError>>;

export function analyze(
  this: InternalUCDStoreContext | void,
  thisOrContext?: InternalUCDStoreContext | AnalyzeOptions,
  options?: AnalyzeOptions,
): Promise<OperationResult<AnalysisReport, StoreError>> {
  if (isUCDStoreInternalContext(thisOrContext)) {
    // thisOrContext is the context
    return _analyze.call(thisOrContext, options);
  }

  // 'this' is the context
  // 'thisOrContext' is actually the 'options'
  return _analyze.call(
    this as InternalUCDStoreContext,
    thisOrContext as AnalyzeOptions,
  );
}

function getExtension(filePath: string): string {
  const match = filePath.match(/\.[^/.]+$/);
  return match ? match[0] : "no_extension";
}
