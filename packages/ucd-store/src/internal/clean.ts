import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";

export interface FileRemovalResult {
  /** Path of the file */
  path: string;
  /** Whether the file was successfully removed */
  removed: boolean;
  /** Error message if removal failed */
  error?: string;
  /** Size of the file in bytes (if available) */
  size?: number;
}

export interface CleanResultSuccess {
  success: true;
  /** List of all files that were targeted for removal */
  filesToRemove: string[];
  /** Detailed results for each file removal attempt */
  fileResults: FileRemovalResult[];
  /** Successfully removed files */
  removedFiles: string[];
  /** Files that couldn't be removed */
  failedRemovals: FileRemovalResult[];
  /** Total number of files successfully deleted */
  deletedCount: number;
  /** Total size freed in bytes */
  freedBytes: number;
}

export interface CleanResultFailure {
  success: false;
  /** Global error that caused the entire operation to fail */
  error: string;
  /** Partial results if some files were processed before failure */
  partialResults?: {
    filesToRemove: string[];
    fileResults: FileRemovalResult[];
    removedFiles: string[];
    failedRemovals: FileRemovalResult[];
    deletedCount: number;
    freedBytes: number;
  };
}

export type CleanResult = CleanResultSuccess | CleanResultFailure;

export interface CleanOptions {
  /**
   * Whether to perform a dry run (no actual file deletions).
   * Defaults to false.
   */
  dryRun?: boolean;

  /**
   * Custom filters to apply when determining which files to remove.
   */
  versions: readonly string[];

  /**
   * Custom filesystem bridge to use for file operations.
   */
  fs?: FileSystemBridge;
}

/**
 * Clean files from a store based on the provided options
 */
export async function cleanStore(
  filesToRemove: string[],
  options: CleanOptions,
): Promise<CleanResult> {
  const { dryRun = false, fs } = options;

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
    const fileResults: FileRemovalResult[] = [];
    const removedFiles: string[] = [];
    const failedRemovals: FileRemovalResult[] = [];
    let freedBytes = 0;

    // Process each file
    for (const filePath of filesToRemove) {
      const result: FileRemovalResult = {
        path: filePath,
        removed: false,
      };

      try {
        // Check if file exists
        const exists = await fileSystem.exists(filePath);
        if (!exists) {
          result.error = "File not found";
          fileResults.push(result);
          failedRemovals.push(result);
          continue;
        }

        try {
          const stats = await fileSystem.stat(filePath);
          if (stats?.size) {
            result.size = stats.size;
          }
        } catch {
          // Size not available, continue anyway
        }

        // Remove file (unless dry run)
        if (!dryRun) {
          await fileSystem.rm(filePath);
        }

        result.removed = true;
        removedFiles.push(filePath);
        if (result.size) {
          freedBytes += result.size;
        }
      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
        failedRemovals.push(result);
      }

      fileResults.push(result);
    }

    return {
      success: true,
      filesToRemove,
      fileResults,
      removedFiles,
      failedRemovals,
      deletedCount: removedFiles.length,
      freedBytes,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Helper method to get human-readable cleanup summary
 */
export function getCleanSummary(result: CleanResult): string {
  if (!result.success) {
    return `Cleanup failed: ${result.error}`;
  }

  const { deletedCount, freedBytes, failedRemovals } = result;
  const sizeText = freedBytes > 0 ? ` (${formatBytes(freedBytes)} freed)` : "";
  const failedText = failedRemovals.length > 0 ? `, ${failedRemovals.length} failed` : "";

  return `Cleaned ${deletedCount} files${sizeText}${failedText}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
