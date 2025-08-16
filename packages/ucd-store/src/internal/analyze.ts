import type { UCDStore } from "../store";
import { UCDStoreVersionNotFoundError } from "../errors";
import { getExpectedFilePaths } from "./files";

export interface AnalyzeOptions {
  /**
   * Whether to check for orphaned files in the store.
   * Orphaned files are those that are not referenced by any Unicode version or data.
   * This can help identify files that are no longer needed.
   */
  checkOrphaned?: boolean;

  /**
   * Specific versions to analyze (if not provided, analyzes all)
   */
  versions?: string[];
}

export interface AnalyzeResult {
  /**
   * Analyzed Unicode version
   * This should be in the format "major.minor.patch" (e.g., "15.0.0")
   */
  version: string;

  /**
   * List of orphaned files (files that exist but shouldn't)
   */
  orphanedFiles: string[];

  /**
   * List of missing files (if any)
   */
  missingFiles: string[];

  /**
   * List of files that were found in the store for this version
   *
   * NOTE:
   * This does not include orphaned files. It only includes files that are expected to be present for the version.
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

  /**
   * Whether the version is complete
   * This means all expected files are present and no orphaned files exist.
   * If this is false, it indicates that some files are missing or there are orphaned files.
   */
  isComplete: boolean;
}

export async function internal__analyze(store: UCDStore, options: Required<AnalyzeOptions>): Promise<AnalyzeResult[]> {
  const { checkOrphaned, versions } = options;

  const promises = versions.map(async (version) => {
    if (!store.versions.includes(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    // get the expected files for this version
    const expectedFiles = await getExpectedFilePaths(store.client, version);

    // get the actual files from the store
    const actualFiles = await store.getFilePaths(version);

    const orphanedFiles: string[] = [];
    const missingFiles: string[] = [];
    const files: string[] = [];

    for (const expectedFile of expectedFiles) {
      if (!actualFiles.includes(expectedFile)) {
        missingFiles.push(expectedFile);
      }
    }

    for (const actualFile of actualFiles) {
      // if file is not in expected files, it's orphaned
      if (checkOrphaned && !expectedFiles.includes(actualFile)) {
        orphanedFiles.push(actualFile);
        continue;
      }

      files.push(actualFile);
    }

    const isComplete = orphanedFiles.length === 0 && missingFiles.length === 0;
    return {
      version,
      orphanedFiles,
      missingFiles,
      fileCount: actualFiles.length,
      expectedFileCount: expectedFiles.length,
      isComplete,
      files,
    } satisfies AnalyzeResult;
  });

  return Promise.all(promises);
}
