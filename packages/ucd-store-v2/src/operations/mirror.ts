import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../types";
import {
  createConcurrencyLimiter,
  createDebugger,
  filterTreeStructure,
  flattenFilePaths,
  tryCatch,
} from "@ucdjs-internal/shared";
import { hasCapability } from "@ucdjs/fs-bridge";
import { dirname, join } from "pathe";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../errors";

const debug = createDebugger("ucdjs:ucd-store:mirror");

export interface MirrorOptions extends SharedOperationOptions {
  /**
   * Specific versions to mirror. If not provided, mirrors all manifest versions.
   */
  versions?: string[];

  /**
   * Whether to re-download files even if they already exist locally.
   * @default false
   */
  force?: boolean;

  /**
   * Maximum concurrent downloads
   * @default 5
   */
  concurrency?: number;

  /**
   * Progress callback for tracking downloads
   */
  onProgress?: MirrorProgressCallback;
}

export type MirrorProgressCallback = (progress: MirrorProgress) => void;

export interface MirrorProgress {
  /**
   * The Unicode version being mirrored
   */
  version: string;

  /**
   * The number of files processed so far
   */
  current: number;

  /**
   * The total number of files to process
   */
  total: number;

  /**
   * The current file being processed
   */
  file: string;
}

interface OverallSummary {
  /**
   * Total number of files that were queued for processing
   */
  totalFiles: number;

  /**
   * Number of files successfully downloaded
   */
  downloaded: number;

  /**
   * Number of files skipped (already existed locally and force=false)
   */
  skipped: number;

  /**
   * Number of files that failed to download
   */
  failed: number;

  /**
   * Total operation duration in milliseconds
   */
  duration: number;

  /**
   * Human-readable total size of all downloaded files
   */
  totalSize: string;
}

export interface MirrorReport {
  /** ISO 8601 timestamp when the operation completed */
  timestamp: string;
  /**
   * Results for each mirrored version
   */
  versions: MirrorVersionReport[];

  /**
   * Overall operation statistics
   */
  summary: OverallSummary;
}

/**
 * Per-version mirror operation results.
 *
 * Contains statistics and error details for a single Unicode version that was mirrored.
 */
export interface MirrorVersionReport {
  /** The Unicode version that was mirrored */
  version: string;
  /** Number of files successfully downloaded for this version */
  filesDownloaded: number;
  /** Number of files skipped for this version */
  filesSkipped: number;
  /** Number of files that failed to download for this version */
  filesFailed: number;
  /** Human-readable total size of downloaded files for this version */
  size: string;
  /** List of download errors with file paths and reasons */
  errors: Array<{ file: string; reason: string }>;
}

/**
 * Internal queue item for processing a single file download.
 *
 * Used internally by the mirror operation to track file downloads and associated metadata.
 */
interface MirrorQueueItem {
  /** The Unicode version for this file */
  version: string;
  /** The relative file path within the version */
  filePath: string;
  /** The full local filesystem path where the file will be saved */
  localPath: string;
  /** The remote path used to fetch the file from the API */
  remotePath: string;
  /** Reference to the version report being updated with results */
  versionResult: MirrorVersionReport;
}

/**
 * Running statistics accumulated during the mirror operation.
 *
 * Used to track aggregate numbers across all concurrent downloads.
 */
interface SummaryStats {
  /** Running count of successfully downloaded files */
  downloaded: number;
  /** Running count of skipped files */
  skipped: number;
  /** Running count of failed downloads */
  failed: number;
  /** Accumulated byte size of all downloaded content */
  totalSize: number;
  /** Total files processed (downloaded + skipped + failed) */
  completed: number;
}

/**
 * Mirrors Unicode data files from the API to local storage.
 * Downloads actual Unicode data files for specified versions.
 *
 * @param {InternalUCDStoreContext} context - Internal store context
 * @param {MirrorOptions} [options] - Mirror options
 * @returns {Promise<OperationResult<MirrorReport, StoreError>>} Operation result
 */
export async function mirror(
  context: InternalUCDStoreContext,
  options?: MirrorOptions,
): Promise<OperationResult<MirrorReport, StoreError>> {
  return tryCatch(async () => {
    if (!hasCapability(context.fs, ["mkdir", "write"])) {
      throw new UCDStoreGenericError("Filesystem does not support required write operations for mirroring.");
    }

    const versions = options?.versions ?? context.versions;
    const concurrency = options?.concurrency ?? 5;
    const force = options?.force ?? false;

    if (versions.length === 0) {
      debug?.("No versions to mirror");
      return {
        timestamp: new Date().toISOString(),
        versions: [],
        summary: {
          totalFiles: 0,
          downloaded: 0,
          skipped: 0,
          failed: 0,
          duration: 0,
          totalSize: "0 B",
        },
      };
    }

    // Validate all versions exist in context
    for (const version of versions) {
      if (!context.versions.includes(version)) {
        throw new UCDStoreVersionNotFoundError(version);
      }
    }

    const startTime = Date.now();
    const limit = createConcurrencyLimiter(concurrency);

    debug?.(`Starting mirror for ${versions.length} version(s) with concurrency=${concurrency}`);

    const versionResults = new Map<string, MirrorVersionReport>(
      versions.map((version) => [
        version,
        {
          version,
          filesDownloaded: 0,
          filesSkipped: 0,
          filesFailed: 0,
          size: "0 B",
          errors: [],
        },
      ]),
    );

    const directoriesToCreate = new Set<string>();
    const filesQueue: MirrorQueueItem[] = [];

    for (const version of versions) {
      debug?.(`Fetching file tree for version ${version}`);

      const result = await context.client.versions.getFileTree(version);

      if (result.error) {
        throw new UCDStoreGenericError(
          `Failed to fetch file tree for version '${version}': ${result.error.message}`,
          { version, status: result.error.status },
        );
      }

      if (result.data == null) {
        throw new UCDStoreGenericError(
          `Failed to fetch file tree for version '${version}': no data returned`,
          { version },
        );
      }

      const filteredTree = filterTreeStructure(context.filter, result.data, options?.filters);
      const filePaths = flattenFilePaths(filteredTree);

      debug?.(`Found ${filePaths.length} files for version ${version} after filtering`);

      const versionResult = versionResults.get(version)!;

      // build queue items with all paths pre-computed
      for (const filePath of filePaths) {
        const localPath = join(context.basePath, version, filePath);
        const remotePath = `${version}/${filePath}`;

        directoriesToCreate.add(dirname(localPath));

        filesQueue.push({
          version,
          filePath,
          localPath,
          remotePath,
          versionResult,
        });
      }
    }

    const totalFiles = filesQueue.length;
    debug?.(`Total files to mirror: ${totalFiles}, directories to create: ${directoriesToCreate.size}`);

    await Promise.all([...directoriesToCreate].map(async (dir) => {
      if (!await context.fs.exists(dir)) {
        await context.fs.mkdir!(dir);
      }
    }));

    const stats: SummaryStats = {
      downloaded: 0,
      skipped: 0,
      failed: 0,
      totalSize: 0,
      completed: 0,
    };

    await Promise.all(filesQueue.map((item) => limit(async () => {
      try {
        // Skip if file exists and force is disabled
        if (!force && await context.fs.exists(item.localPath)) {
          item.versionResult.filesSkipped++;
          stats.skipped++;
          stats.completed++;

          options?.onProgress?.({
            version: item.version,
            file: item.filePath,
            current: stats.completed,
            total: totalFiles,
          });

          return;
        }

        // Fetch file content from API
        const result = await context.client.files.get(item.remotePath);

        if (result.error) {
          throw new UCDStoreGenericError(
            `Failed to fetch file '${item.filePath}': ${result.error.message}`,
          );
        }

        if (!result.data) {
          throw new UCDStoreGenericError(
            `Failed to fetch file '${item.filePath}': no data returned`,
          );
        }

        // Convert content to string and calculate size
        const content = typeof result.data === "string"
          ? result.data
          : JSON.stringify(result.data);

        const contentSize = getContentSize(content);

        // Write to disk
        await context.fs.write!(item.localPath, content);

        // Update statistics
        item.versionResult.filesDownloaded++;
        stats.downloaded++;
        stats.totalSize += contentSize;
        stats.completed++;

        options?.onProgress?.({
          version: item.version,
          file: item.filePath,
          current: stats.completed,
          total: totalFiles,
        });
      } catch (error) {
        item.versionResult.filesFailed++;
        item.versionResult.errors.push({
          file: item.filePath,
          reason: error instanceof Error ? error.message : String(error),
        });
        stats.failed++;
        stats.completed++;

        debug?.(`Failed to mirror file ${item.filePath} for version ${item.version}:`, error);
      }
    })));

    for (const versionResult of versionResults.values()) {
      if (versionResult.filesDownloaded > 0 && stats.downloaded > 0) {
        const proportion = versionResult.filesDownloaded / stats.downloaded;
        versionResult.size = formatBytes(Math.floor(stats.totalSize * proportion));
      }
    }

    const duration = Date.now() - startTime;

    debug?.(`Mirror completed: ${stats.downloaded} downloaded, ${stats.skipped} skipped, ${stats.failed} failed in ${duration}ms`);

    return {
      timestamp: new Date().toISOString(),
      versions: Array.from(versionResults.values()),
      summary: {
        totalFiles,
        downloaded: stats.downloaded,
        skipped: stats.skipped,
        failed: stats.failed,
        duration,
        totalSize: formatBytes(stats.totalSize),
      },
    };
  });
}

function getContentSize(content: string): number {
  return new TextEncoder().encode(content).length;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / (1024 ** i);

  return `${value.toFixed(2)} ${sizes[i]}`;
}
