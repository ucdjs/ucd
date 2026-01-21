import type { StoreError } from "../errors";
import type {
  BaseOperationReport,
  BaseVersionReport,
  FileCounts,
  InternalUCDStoreContext,
  ReportFile,
  SharedOperationOptions,
} from "../types";
import type { OperationResult } from "@ucdjs-internal/shared";
import { prependLeadingSlash } from "@luxass/utils";
import {
  createConcurrencyLimiter,
  createDebugger,
  filterTreeStructure,
  flattenFilePaths,
  normalizeTreeForFiltering,
  wrapTry,
} from "@ucdjs-internal/shared";
import { hasCapability } from "@ucdjs/fs-bridge";
import {
  computeFileHash,
  computeFileHashWithoutUCDHeader,
  readLockfileOrUndefined,
  writeLockfile,
  writeSnapshot,
} from "@ucdjs/lockfile";
import { patheDirname, patheJoin } from "@ucdjs/path-utils";
import { hasUCDFolderPath } from "@unicode-utils/core";
import { extractFilterPatterns, isUCDStoreInternalContext } from "../context";
import { UCDStoreGenericError } from "../errors";
import {
  computeMetrics,
  computeStorageMetrics,
  createEmptySummary,
} from "../utils/reports";

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

export interface MirrorFilesReport {
  /**
   * List of successfully downloaded files.
   */
  downloaded: ReportFile[];

  /**
   * List of skipped files (already existed locally).
   */
  skipped: ReportFile[];

  /**
   * List of failed files.
   */
  failed: ReportFile[];
}

export interface MirrorVersionReport extends BaseVersionReport {
  /**
   * Categorized file lists.
   */
  files: MirrorFilesReport;
}

export interface MirrorReport extends BaseOperationReport {
  /**
   * Per-version mirror results.
   */
  versions: Map<string, MirrorVersionReport>;
}

/**
 * @internal
 */
interface MirrorQueueItem {
  name: string;
  version: string;
  filePath: string;
  localPath: string;
  remotePath: string;
  versionResult: MirrorVersionReport;
}

/**
 * Helper to create a ReportFile from file information.
 */
function createReportFile(name: string, filePath: string): ReportFile {
  return { name, filePath: `/${filePath}` };
}

/**
 * Helper to create a version report with empty initial state.
 */
function createVersionReport(version: string): MirrorVersionReport {
  const files: MirrorFilesReport = {
    downloaded: [],
    skipped: [],
    failed: [],
  };

  return {
    version,
    files,
    counts: {
      total: 0, // Will be set when we know the total files for this version
      success: 0,
      skipped: 0,
      failed: 0,
    },
    metrics: {
      successRate: 0,
      cacheHitRate: 0,
      failureRate: 0,
      averageTimePerFile: 0,
    },
    errors: [],
  };
}

/**
 * Updates a version report's counts and metrics based on its file lists.
 */
function finalizeVersionReport(report: MirrorVersionReport, duration: number): void {
  const total = report.files.downloaded.length + report.files.skipped.length + report.files.failed.length;
  report.counts = {
    total,
    success: report.files.downloaded.length,
    skipped: report.files.skipped.length,
    failed: report.files.failed.length,
  };
  report.metrics = computeMetrics(report.counts, duration);
}

/**
 * Mirrors Unicode data files from the API to local storage.
 * Downloads actual Unicode data files for specified versions.
 *
 * @this {InternalUCDStoreContext} - Internal store context with client, filters, FS bridge, and configuration
 * @param {MirrorOptions} [options] - Mirror options
 * @returns {Promise<OperationResult<MirrorReport, StoreError>>} Operation result
 */
async function _mirror(
  this: InternalUCDStoreContext,
  options?: MirrorOptions,
): Promise<OperationResult<MirrorReport, StoreError>> {
  return wrapTry(async () => {
    if (!hasCapability(this.fs, ["mkdir", "write"])) {
      throw new UCDStoreGenericError("Filesystem does not support required write operations for mirroring.");
    }

    debug?.("Starting mirror operation with context: %O", this);

    const versions = options?.versions ?? this.versions.resolved;
    const concurrency = options?.concurrency ?? 5;
    const force = options?.force ?? false;

    if (versions.length === 0) {
      debug?.("No versions to mirror");
      return {
        timestamp: new Date().toISOString(),
        versions: new Map<string, MirrorVersionReport>(),
        summary: createEmptySummary(0),
      };
    }

    const startTime = Date.now();
    const limit = createConcurrencyLimiter(concurrency);

    debug?.(`Starting mirror for ${versions.length} version(s) with concurrency=${concurrency}`);

    const versionedReports = new Map<string, MirrorVersionReport>();

    // Initialize version reports
    for (const version of versions) {
      versionedReports.set(version, createVersionReport(version));
    }

    const directoriesToCreate = new Set<string>();
    const filesQueue: MirrorQueueItem[] = [];

    for (const version of versions) {
      debug?.(`Fetching file tree for version ${version}`);

      const result = await this.client.versions.getFileTree(version);
      debug?.(`Fetched file tree for version ${version}`);
      if (result.error) {
        throw new UCDStoreGenericError(
          `Failed to fetch file tree for version '${version}': ${result.error.message}`,
          { version, status: result.error.status },
        );
      }

      debug?.(`Processing file tree for version ${version}: %O`, result.data);

      if (result.data == null) {
        throw new UCDStoreGenericError(
          `Failed to fetch file tree for version '${version}': no data returned`,
          { version },
        );
      }

      // Normalize the tree paths for filtering (strip version/ucd prefix)
      // so that filter patterns like "Blocks.txt" or "auxiliary/**" match correctly
      const normalizedTree = normalizeTreeForFiltering(version, result.data);
      const filteredTree = filterTreeStructure(this.filter, normalizedTree, options?.filters);
      const filePaths = flattenFilePaths(filteredTree);

      debug?.(`Found ${filePaths.length} files for version ${version} after filtering`);

      if (!versionedReports.has(version)) {
        throw new UCDStoreGenericError(`Internal error: missing version report for ${version}`);
      }

      const versionResult = versionedReports.get(version)!;

      for (const filePath of filePaths) {
        // Store subdomain returns clean paths - no transformation needed
        // filePath is already normalized by normalizeTreeForFiltering (e.g., "Blocks.txt" or "auxiliary/file.txt")
        const normalized = filePath.replace(/^\/+/, "");
        const localPath = patheJoin(version, normalized);
        // For remote path, we need to add /ucd/ prefix for versions that have it
        const remotePath = patheJoin(version, hasUCDFolderPath(version) ? "ucd" : "", normalized);

        directoriesToCreate.add(patheDirname(localPath));

        debug?.(
          `Queueing file for mirroring: version=${version}, filePath=${filePath}, normalized=${normalized}, localPath=${localPath}, remotePath=${remotePath}`,
        );

        filesQueue.push({
          name: normalized,
          version,
          filePath: normalized,
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
      if (!await this.fs.exists(dir)) {
        // We have verified that `mkdir` capability exists
        // at the top of the function
        await this.fs.mkdir!(dir);
      }
    }));

    await Promise.all(filesQueue.map((item) => limit(async () => {
      try {
        // Skip if file exists and force is disabled
        if (!force && await this.fs.exists(item.localPath)) {
          item.versionResult.files.skipped.push(
            createReportFile(item.name, item.localPath),
          );

          return;
        }

        debug?.(`Fetching file ${item.remotePath} from API`);

        // Fetch file content from API
        const { data, error, response } = await this.client.files.get(item.remotePath);

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

        await this.fs.write!(item.localPath, content);

        item.versionResult.files.downloaded.push(
          createReportFile(item.name, item.localPath),
        );
        totalDownloadedSize += contentSize;
      } catch (err) {
        item.versionResult.files.failed.push(
          createReportFile(item.name, item.localPath),
        );
        item.versionResult.errors.push({
          name: item.name,
          filePath: prependLeadingSlash(item.localPath),
          reason: err instanceof Error ? err.message : String(err),
        });

        debug?.(`Failed to mirror file ${item.remotePath} for version ${item.version}:`, err);
      }
    })));

    const duration = Date.now() - startTime;

    // Finalize version reports with counts and metrics
    for (const report of versionedReports.values()) {
      finalizeVersionReport(report, duration / versions.length);

      // Sort file lists for deterministic output
      report.files.downloaded.sort((a, b) => a.name.localeCompare(b.name));
      report.files.skipped.sort((a, b) => a.name.localeCompare(b.name));
      report.files.failed.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Create snapshots and update lockfile for mirrored versions
    const lockfile = await readLockfileOrUndefined(this.fs, this.lockfile.path);
    const updatedLockfileVersions = lockfile ? { ...lockfile.versions } : {};
    const now = new Date();

    for (const [version, report] of versionedReports.entries()) {
      // Create snapshot if any files were processed (downloaded or skipped)
      const allFiles = [...report.files.downloaded, ...report.files.skipped];
      debug?.(`Preparing snapshot for version ${version}, total files: ${allFiles.length}`);
      debug?.(`Files: %O`, allFiles);
      if (allFiles.length > 0) {
        debug?.(`Creating snapshot for version ${version}`);

        // Read all mirrored files (downloaded + skipped) and compute hashes
        const snapshotFiles: Record<string, { hash: string; fileHash: string; size: number }> = {};
        let totalSize = 0;

        for (const localFile of allFiles) {
          const normalizedPath = localFile.filePath.startsWith(`${version}/`)
            ? localFile.filePath.slice(version.length + 1)
            : localFile.filePath;

          debug?.(`Processing file for snapshot: version=${version}, localPath=${localFile.filePath}, normalizedPath=${normalizedPath}`);
          const fileContent = await this.fs.read(localFile.filePath);

          if (fileContent) {
            // Compute content hash (without Unicode header) for content comparison
            const hash = await computeFileHashWithoutUCDHeader(fileContent);
            // Compute file hash (full file) for integrity verification
            const fileHash = await computeFileHash(fileContent);
            const size = new TextEncoder().encode(fileContent).length;
            snapshotFiles[normalizedPath] = { hash, fileHash, size };
            totalSize += size;
          }
        }

        // Write snapshot
        await writeSnapshot(this.fs, version, {
          unicodeVersion: version,
          files: snapshotFiles,
        });

        // Update lockfile entry - preserve createdAt if version already exists
        const existingEntry = updatedLockfileVersions[version];
        updatedLockfileVersions[version] = {
          path: `${version}/snapshot.json`,
          fileCount: allFiles.length,
          totalSize,
          createdAt: existingEntry?.createdAt ?? now,
          updatedAt: now,
        };
      }
    }

    // Write updated lockfile
    if (Object.keys(updatedLockfileVersions).length > 0) {
      // Preserve filters from existing lockfile or use current context filters
      const filters = extractFilterPatterns(this.filter) ?? lockfile?.filters;

      await writeLockfile(this.fs, this.lockfile.path, {
        lockfileVersion: 1,
        createdAt: lockfile?.createdAt ?? now,
        updatedAt: now,
        versions: updatedLockfileVersions,
        filters,
      });
    }

    // Aggregate counts from version reports
    const aggregatedCounts: FileCounts = {
      total: 0,
      success: 0,
      skipped: 0,
      failed: 0,
    };

    for (const report of versionedReports.values()) {
      aggregatedCounts.total += report.counts.total;
      aggregatedCounts.success += report.counts.success;
      aggregatedCounts.skipped += report.counts.skipped;
      aggregatedCounts.failed += report.counts.failed;
    }

    const summary = {
      duration,
      counts: aggregatedCounts,
      metrics: computeMetrics(aggregatedCounts, duration),
      storage: computeStorageMetrics(totalDownloadedSize, aggregatedCounts.success),
    };

    debug?.(
      `Mirror completed: %d downloaded, %d skipped, %d failed in ${duration}ms`,
      summary.counts.success,
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

export function mirror(
  context: InternalUCDStoreContext,
  options?: MirrorOptions,
): Promise<OperationResult<MirrorReport, StoreError>>;

export function mirror(
  this: InternalUCDStoreContext,
  options?: MirrorOptions,
): Promise<OperationResult<MirrorReport, StoreError>>;

export function mirror(
  this: InternalUCDStoreContext | void,
  thisOrContext?: InternalUCDStoreContext | MirrorOptions,
  options?: MirrorOptions,
): Promise<OperationResult<MirrorReport, StoreError>> {
  if (isUCDStoreInternalContext(thisOrContext)) {
    // thisOrContext is the context
    return _mirror.call(thisOrContext, options);
  }

  // 'this' is the context
  // 'thisOrContext' is actually the 'options'
  return _mirror.call(
    this as InternalUCDStoreContext,
    thisOrContext as MirrorOptions,
  );
}
