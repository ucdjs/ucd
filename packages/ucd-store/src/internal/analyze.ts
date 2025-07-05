import type { UCDClient, UnicodeVersionFile } from "@ucdjs/fetch";
import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { promiseRetry } from "@luxass/utils";
import { ApiResponseError } from "@ucdjs/fetch";
import { flattenFilePaths } from "./helpers";

export interface VersionAnalysis {
  /** Unicode version */
  version: string;
  /** Number of files found for this version */
  fileCount: number;
  /** Whether all expected files are present */
  isComplete: boolean;
  /** List of missing files (if any) */
  missingFiles?: string[];
  /** List of orphaned files (files that exist but shouldn't) */
  orphanedFiles?: string[];
  /** Total size of files for this version in bytes */
  totalSize?: number;
}

export interface AnalyzeResultSuccess {
  success: true;
  /** Total number of files across all versions */
  totalFiles: number;
  /** Total size of all files in bytes */
  totalSize: number;
  /** Detailed analysis for each version */
  versions: VersionAnalysis[];
  /** Files that should be removed (orphaned/outdated) */
  filesToRemove: string[];
  /** Overall health status of the store */
  storeHealth: "healthy" | "needs_cleanup" | "corrupted";
}

export interface AnalyzeResultFailure {
  success: false;
  /** Global error that caused the analysis to fail */
  error: string;
  /** Partial results if some analysis was completed before failure */
  partialResults?: {
    totalFiles: number;
    totalSize: number;
    versions: VersionAnalysis[];
    filesToRemove: string[];
  };
}

export type AnalyzeResult = AnalyzeResultSuccess | AnalyzeResultFailure;

export interface AnalyzeOptions {
  /**
   * Specific versions to analyze (if not provided, analyzes all)
   */
  versions?: string[];

  /**
   * Additional filters to apply during analysis
   */
  extraFilters?: string[];

  /**
   * File system bridge to use for operations
   */
  fs?: FileSystemBridge;

  /**
   * UCD client to use for API calls
   */
  client?: UCDClient;

  /**
   * Whether to check for orphaned files
   */
  checkOrphaned?: boolean;

  /**
   * Whether to calculate file sizes
   */
  calculateSizes?: boolean;
}

export async function analyzeStore(
  manifestPath: string,
  options: AnalyzeOptions = {},
): Promise<AnalyzeResult> {
  const {
    fs,
    client,
    versions,
    checkOrphaned = true,
    calculateSizes = true,
  } = options;

  if (!client) {
    return {
      success: false,
      error: "UCD client is required for analysis",
    };
  }

  // Default to remote HTTP filesystem if not provided
  let fileSystem = fs;
  if (!fileSystem) {
    const { UCDJS_API_BASE_URL } = await import("@ucdjs/env");
    const httpFsBridge = await import("@ucdjs/utils/fs-bridge/http").then((m) => m.default);
    fileSystem = typeof httpFsBridge === "function"
      ? httpFsBridge({
          baseUrl: `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/`,
        })
      : httpFsBridge;
  }

  try {
    // Read manifest file to get versions and their paths
    const manifestExists = await fileSystem.exists(manifestPath);
    if (!manifestExists) {
      return {
        success: false,
        error: "Manifest file (.ucd-store.json) not found",
      };
    }

    const manifestContent = await fileSystem.read(manifestPath);
    const manifestData = JSON.parse(manifestContent);
    const manifestVersions = manifestData.map((entry: any) => entry.version);
    const versionPaths = manifestData.reduce((acc: Record<string, string>, entry: any) => {
      acc[entry.version] = entry.path;
      return acc;
    }, {});

    // Use provided versions or fall back to manifest versions
    const versionsToAnalyze = versions && versions.length > 0 ? versions : manifestVersions;

    const versionAnalyses: VersionAnalysis[] = [];
    const allFilesToRemove: string[] = [];
    let totalFiles = 0;
    let totalSize = 0;

    // Analyze each version
    for (const version of versionsToAnalyze) {
      const analysis: VersionAnalysis = {
        version,
        fileCount: 0,
        isComplete: true,
        missingFiles: [],
        orphanedFiles: [],
        totalSize: 0,
      };

      try {
        // Get expected files from API using UCD client
        let expectedFiles: string[] = [];

        try {
          const data = await promiseRetry(async () => {
            const { data, error } = await options.client!.GET("/api/v1/files/{version}", {
              params: { path: { version } },
            });

            if (error != null) {
              throw new ApiResponseError(error);
            }

            return data;
          }, {
            retries: 3,
            minTimeout: 500,
          });

          expectedFiles = flattenFilePaths(data);
        } catch (error) {
          // API call failed, mark version as incomplete
          analysis.isComplete = false;
          analysis.missingFiles = [`Failed to fetch expected files: ${error instanceof Error ? error.message : String(error)}`];
          versionAnalyses.push(analysis);
          continue;
        }

        // Get version path from manifest
        const versionPath = versionPaths[version];
        const versionExists = await fileSystem.exists(versionPath);

        if (!versionExists) {
          analysis.isComplete = false;
          analysis.missingFiles = expectedFiles;
          versionAnalyses.push(analysis);
          continue;
        }

        // Check each expected file
        let versionSize = 0;
        const existingFiles: string[] = [];
        const missingFiles: string[] = [];

        for (const expectedFile of expectedFiles) {
          const filePath = `${versionPath}/${expectedFile}`;

          try {
            const exists = await fileSystem.exists(filePath);
            if (exists) {
              existingFiles.push(expectedFile);
              analysis.fileCount++;

              // Calculate size if requested
              if (calculateSizes && fileSystem.stat) {
                try {
                  const stats = await fileSystem.stat(filePath);
                  if (stats?.size) {
                    versionSize += stats.size;
                  }
                } catch {
                  // Size not available, continue
                }
              }
            } else {
              missingFiles.push(expectedFile);
              analysis.isComplete = false;
            }
          } catch {
            // File access failed, consider it missing
            missingFiles.push(expectedFile);
            analysis.isComplete = false;
          }
        }

        // Check for orphaned files if requested
        if (checkOrphaned) {
          try {
            if (fileSystem.listdir) {
              const actualFiles = await fileSystem.listdir(versionPath, true);
              const orphanedFiles = actualFiles.filter((file) => {
                const relativePath = file.replace(`${versionPath}/`, "");
                return !expectedFiles.includes(relativePath);
              });

              if (orphanedFiles.length > 0) {
                analysis.orphanedFiles = orphanedFiles.map((file) => file.replace(`${versionPath}/`, ""));
                allFilesToRemove.push(...orphanedFiles);
              }
            }
          } catch {
            // Orphaned file detection failed, continue
          }
        }

        analysis.missingFiles = missingFiles;
        analysis.totalSize = versionSize;
        totalFiles += analysis.fileCount;
        totalSize += versionSize;

        versionAnalyses.push(analysis);
      } catch (error) {
        // Handle version-specific errors
        analysis.isComplete = false;
        versionAnalyses.push(analysis);
      }
    }

    // Determine overall store health
    const hasIncompleteVersions = versionAnalyses.some((v) => !v.isComplete);
    const hasFilesToRemove = allFilesToRemove.length > 0;

    let storeHealth: "healthy" | "needs_cleanup" | "corrupted" = "healthy";
    if (hasIncompleteVersions) {
      storeHealth = "corrupted";
    } else if (hasFilesToRemove) {
      storeHealth = "needs_cleanup";
    }

    return {
      success: true,
      totalFiles,
      totalSize,
      versions: versionAnalyses,
      filesToRemove: allFilesToRemove,
      storeHealth,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Helper method to get human-readable analysis summary
 */
export function getAnalyzeSummary(result: AnalyzeResult): string {
  if (!result.success) {
    return `Analysis failed: ${result.error}`;
  }

  const { totalFiles, versions, filesToRemove, storeHealth } = result;
  const incompleteVersions = versions.filter((v) => !v.isComplete).length;
  const healthText = storeHealth === "healthy"
    ? "healthy"
    : storeHealth === "needs_cleanup" ? "needs cleanup" : "corrupted";

  let summary = `Found ${totalFiles} files across ${versions.length} versions (${healthText})`;

  if (incompleteVersions > 0) {
    summary += `, ${incompleteVersions} incomplete versions`;
  }

  if (filesToRemove.length > 0) {
    summary += `, ${filesToRemove.length} files to remove`;
  }

  return summary;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
