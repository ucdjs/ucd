import type { OperationResult } from "@ucdjs-internal/shared";
import type { Lockfile, Snapshot } from "@ucdjs/schemas";
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
import {
  canUseLockfile,
  getLockfilePath,
  readLockfileOrDefault,
  writeLockfile,
} from "../core/lockfile";
import {
  computeFileHash,
  getSnapshotPath,
  readSnapshotOrDefault,
  writeSnapshot,
} from "../core/snapshot";
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

    // Check if lockfile/snapshot system can be used
    const useLockfile = canUseLockfile(context.fs);
    const lockfilePath = getLockfilePath(context.basePath);
    let lockfile: Lockfile | undefined;
    const versionSnapshots = new Map<string, Snapshot>();
    const newSnapshots = new Map<string, Snapshot>();

    if (useLockfile) {
      debug?.("Lockfile system is available, loading existing lockfile and snapshots");
      lockfile = await readLockfileOrDefault(context.fs, lockfilePath);

      // Load snapshots for each version and initialize new snapshots
      for (const version of versions) {
        const snapshot = await readSnapshotOrDefault(context.fs, context.basePath, version);
        if (snapshot) {
          versionSnapshots.set(version, snapshot);
          // Start with existing snapshot, will be updated as files are downloaded
          newSnapshots.set(version, {
            schema: "unicode-snapshot@1",
            unicodeVersion: version,
            files: { ...snapshot.files },
          });
          debug?.(`Loaded snapshot for version ${version} with ${Object.keys(snapshot.files).length} files`);
        } else {
          // Create new snapshot for this version
          newSnapshots.set(version, {
            schema: "unicode-snapshot@1",
            unicodeVersion: version,
            files: {},
          });
        }
      }
    } else {
      debug?.("Lockfile system not available (read-only filesystem), skipping lockfile operations");
    }

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
      const totalMetricValue = (report?.files.downloaded.length ?? 0) + (report?.files.skipped.length ?? 0) + (report?.files.failed.length ?? 0);

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
            return totalMetricValue > 0 ? (report?.files.skipped.length ?? 0) / totalMetricValue * 100 : 0;
          },
          get failureRate() {
            return totalMetricValue > 0 ? (report?.files.failed.length ?? 0) / totalMetricValue * 100 : 0;
          },
          get successRate() {
            return totalMetricValue > 0 ? (report?.files.downloaded.length ?? 0) / totalMetricValue * 100 : 0;
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
        // Check snapshot for file integrity if available
        const snapshot = versionSnapshots.get(item.version);
        const snapshotFile = snapshot?.files[item.filePath];

        if (!force && snapshotFile) {
          // File exists in snapshot, check if local file matches
          if (await context.fs.exists(item.localPath)) {
            const localContent = await context.fs.read(item.localPath);
            if (localContent) {
              const localHash = await computeFileHash(localContent);
              if (localHash === snapshotFile.hash && localContent.length === snapshotFile.size) {
                debug?.(`File ${item.filePath} matches snapshot, skipping`);
                item.versionResult.files.skipped.push(item.filePath);
                return;
              }
            }
          }
        }

        // Skip if file exists and force is disabled (fallback check)
        if (!force && await context.fs.exists(item.localPath)) {
          item.versionResult.files.skipped.push(item.filePath);
          return;
        }

        // Fetch file content from API
        const { data, error, response } = await context.client.files.get(item.remotePath);

        if (error) {
          throw new UCDStoreGenericError(
            `Failed to fetch file '${item.filePath}': ${error.message}`,
          );
        }

        if (!data) {
          throw new UCDStoreGenericError(
            `Failed to fetch file '${item.filePath}': no data returned`,
          );
        }

        const contentSize = +(response?.headers.get("content-length") ?? "0");
        const contentType = response?.headers.get("content-type");
        let content;

        if (typeof data === "string") {
          content = data;
        } else if (
          typeof data === "object"
          && !Array.isArray(data)
          && Object.prototype.toString.call(data) === "[object Object]"
          && contentType === "application/json"
        ) {
          content = JSON.stringify(data);
        } else {
          throw new UCDStoreGenericError(
            `Failed to mirror file '${item.filePath}': unsupported data type received`,
          );
        }

        await context.fs.write!(item.localPath, content);

        item.versionResult.files.downloaded.push(item.filePath);
        totalDownloadedSize += contentSize;

        // Update snapshot with file hash and size
        if (useLockfile) {
          const newSnapshot = newSnapshots.get(item.version);
          if (newSnapshot) {
            const hash = await computeFileHash(content);
            newSnapshot.files[item.filePath] = {
              hash,
              size: content.length,
            };
          }
        }
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

    // Generate snapshots and update lockfile if lockfile system is available
    if (useLockfile) {
      debug?.("Generating snapshots and updating lockfile");

      const lockfileVersions: Record<string, { path: string; fileCount: number; totalSize: number }> = {};

      for (const version of versions) {
        const snapshot = newSnapshots.get(version);
        if (snapshot && Object.keys(snapshot.files).length > 0) {
          // Calculate totals for this version
          let totalSize = 0;
          for (const file of Object.values(snapshot.files)) {
            totalSize += file.size;
          }

          // Write snapshot
          await writeSnapshot(context.fs, context.basePath, version, snapshot);

          // Add to lockfile (path is relative to basePath)
          lockfileVersions[version] = {
            path: `.snapshots/${version}.json`,
            fileCount: Object.keys(snapshot.files).length,
            totalSize,
          };

          debug?.(`Generated snapshot for version ${version}: ${lockfileVersions[version].fileCount} files, ${totalSize} bytes`);
        }
      }

      // Create or update lockfile (merge with existing if present)
      const existingVersions = lockfile?.versions ?? {};
      const newLockfile: Lockfile = {
        lockfileVersion: 1,
        schema: "unicode-mirror-index@1",
        versions: {
          ...existingVersions,
          ...lockfileVersions,
        },
      };

      await writeLockfile(context.fs, lockfilePath, newLockfile);
      debug?.("Updated lockfile");
    }

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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const clampedI = Math.max(0, Math.min(i, sizes.length - 1));
  const value = bytes / (1024 ** clampedI);

  return `${value.toFixed(2)} ${sizes[clampedI]}`;
}
