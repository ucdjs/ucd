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
}

export interface MirrorReport {
  timestamp: string;

  versions: Map<string, MirrorVersionReport>;

  summary?: {
  /**
   * Total operation duration in milliseconds
   */
    duration: number;

    counts: {
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
    };

    metrics: {
    /**
     * Success rate as a percentage (0-100)
     */
      successRate: number;

      /**
       * Cache hit rate (skipped) as a percentage (0-100)
       */
      cacheHitRate: number;

      /**
       * Failure rate as a percentage (0-100)
       */
      failureRate: number;

      /**
       * Average milliseconds per file processed
       */
      averageTimePerFile: number;
    };

    storage: {
    /**
     * Human-readable total size of all downloaded files
     */
      totalSize: string;

      /**
       * Average file size for downloaded files
       */
      averageFileSize: string;
    };
  };
}

export interface MirrorVersionReport {
  /**
   * The Unicode version that was mirrored
   */
  version: string;

  counts: {
    /**
     * Number of files successfully downloaded for this version
     */
    downloaded: number;

    /**
     * Number of files skipped for this version
     */
    skipped: number;

    /**
     * Number of files that failed to download for this version
     */
    failed: number;
  };

  metrics: {
    /**
     * Success rate for this version as a percentage (0-100)
     */
    successRate: number;

    /**
     * Cache hit rate (skipped) for this version as a percentage (0-100)
     */
    cacheHitRate: number;

    /**
     * Failure rate for this version as a percentage (0-100)
     */
    failureRate: number;
  };

  files: {
    /**
     * List of successfully downloaded file paths
     */
    downloaded: string[];

    /**
     * List of skipped file paths
     */
    skipped: string[];

    /**
     * List of failed file paths
     */
    failed: string[];
  };

  /**
   * List of download errors with file paths and reasons
   */
  errors: {
    file: string;
    reason: string;
  }[];
}

/**
 * @internal
 */
interface MirrorQueueItem {
  version: string;
  filePath: string;
  localPath: string;
  remotePath: string;
  versionResult: MirrorVersionReport;
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
        versions: new Map<string, MirrorVersionReport>(),
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

    const versionedReports = new Map<string, MirrorVersionReport>();

    let report: MirrorVersionReport | undefined;
    for (const version of versions) {
      report = {
        version,
        files: {
          downloaded: [],
          skipped: [],
          failed: [],
        },
        counts: {
          get downloaded() {
            return report?.files.downloaded.length ?? 0;
          },
          get skipped() {
            return report?.files.skipped.length ?? 0;
          },
          get failed() {
            return report?.files.failed.length ?? 0;
          },
        },
        metrics: {
          get cacheHitRate() {
            return (report?.files.skipped.length ?? 0) / (report?.files.downloaded.length ?? 1) * 100;
          },
          get failureRate() {
            return (report?.files.failed.length ?? 0) / (report?.files.downloaded.length ?? 1) * 100;
          },
          get successRate() {
            return (report?.files.downloaded.length ?? 0) / (report?.files.downloaded.length ?? 1) * 100;
          },
        },
        errors: [],
      };
      versionedReports.set(version, report);
    }

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

      if (!versionedReports.has(version)) {
        throw new UCDStoreGenericError(`Internal error: missing version report for ${version}`);
      }

      const versionResult = versionedReports.get(version)!;

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

    let totalDownloadedSize = 0;

    await Promise.all([...directoriesToCreate].map(async (dir) => {
      if (!await context.fs.exists(dir)) {
        // We have verified that `mkdir` capability exists
        // at the top of the function
        await context.fs.mkdir!(dir);
      }
    }));

    await Promise.all(filesQueue.map((item) => limit(async () => {
      try {
        // Skip if file exists and force is disabled
        if (!force && await context.fs.exists(item.localPath)) {
          item.versionResult.files.skipped.push(item.filePath);

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

        // TODO: handle this better
        // Maybe by returning the size from the api in headers?
        // Since it could allow us to stream the response directly to disk
        const content = typeof result.data === "string"
          ? result.data
          : JSON.stringify(result.data);

        const contentSize = getContentSize(content);

        await context.fs.write!(item.localPath, content);

        item.versionResult.files.downloaded.push(item.filePath);
        totalDownloadedSize += contentSize;
      } catch (err) {
        item.versionResult.files.failed.push(item.filePath);
        item.versionResult.errors.push({
          file: item.filePath,
          reason: err instanceof Error ? err.message : String(err),
        });

        debug?.(`Failed to mirror file ${item.filePath} for version ${item.version}:`, err);
      }
    })));

    const duration = Date.now() - startTime;

    const summary = computeSummary(
      versionedReports,
      totalDownloadedSize,
      duration,
    )!;

    debug?.(
      `Mirror completed: %d downloaded, %d skipped, %d failed in ${duration}ms`,
      summary.counts.downloaded,
      summary.counts.skipped,
      summary.counts.failed,
    );

    return {
      timestamp: new Date().toISOString(),
      versions: versionedReports,
      summary,
    };
  });
}

function computeSummary(
  versionedReports: Map<string, MirrorVersionReport>,
  totalDownloadedSize: number,
  duration: number,
): MirrorReport["summary"] {
  let totalFiles = 0;
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const report of versionedReports.values()) {
    totalFiles += report.counts.downloaded + report.counts.skipped + report.counts.failed;
    downloaded += report.counts.downloaded;
    skipped += report.counts.skipped;
    failed += report.counts.failed;
  }

  const summary = {
    duration,
    counts: {
      totalFiles,
      downloaded,
      skipped,
      failed,
    },
    metrics: {
      successRate: totalFiles > 0 ? (downloaded / totalFiles) * 100 : 0,
      cacheHitRate: totalFiles > 0 ? (skipped / totalFiles) * 100 : 0,
      failureRate: totalFiles > 0 ? (failed / totalFiles) * 100 : 0,
      averageTimePerFile: totalFiles > 0 ? duration / totalFiles : 0,
    },
    storage: {
      totalSize: formatBytes(totalDownloadedSize),
      averageFileSize: downloaded > 0 ? formatBytes(totalDownloadedSize / downloaded) : "0 B",
    },
  } satisfies MirrorReport["summary"];

  return summary;
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
