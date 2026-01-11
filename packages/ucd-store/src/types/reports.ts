/**
 * Shared report types for ucd-store operations (analyze, mirror, sync).
 *
 * These types provide a unified structure for operation results,
 * ensuring consistent output shapes across all store operations.
 */

/**
 * A file entry in a report.
 */
export interface ReportFile {
  /**
   * The normalized file name (without version prefix).
   */
  name: string;

  /**
   * The full local file path (including version prefix).
   */
  filePath: string;
}

/**
 * An error entry in a report.
 */
export interface ReportError extends ReportFile {
  /**
   * The error message or reason for failure.
   */
  reason: string;
}

/**
 * Summary metrics for an operation (percentages, rates, etc.).
 */
export interface OperationMetrics {
  /**
   * Success rate as a percentage (0-100).
   */
  successRate: number;

  /**
   * Cache hit rate (skipped) as a percentage (0-100).
   */
  cacheHitRate: number;

  /**
   * Failure rate as a percentage (0-100).
   */
  failureRate: number;

  /**
   * Average milliseconds per file processed.
   */
  averageTimePerFile: number;
}

/**
 * Storage metrics for an operation.
 */
export interface StorageMetrics {
  /**
   * Human-readable total size of all processed files.
   */
  totalSize: string;

  /**
   * Average file size (human-readable).
   */
  averageFileSize: string;
}

/**
 * Counts for file operations.
 */
export interface FileCounts {
  /**
   * Total number of files queued/expected for processing.
   */
  total: number;

  /**
   * Number of files successfully processed (downloaded/present).
   */
  success: number;

  /**
   * Number of files skipped (already existed locally).
   */
  skipped: number;

  /**
   * Number of files that failed.
   */
  failed: number;
}

/**
 * Summary information for an operation.
 */
export interface OperationSummary {
  /**
   * Total operation duration in milliseconds.
   */
  duration: number;

  /**
   * File counts.
   */
  counts: FileCounts;

  /**
   * Computed metrics (rates, averages).
   */
  metrics: OperationMetrics;

  /**
   * Storage metrics (sizes).
   */
  storage: StorageMetrics;
}

/**
 * Base interface for all operation reports.
 * All store operations (analyze, mirror, sync) should extend this.
 */
export interface BaseOperationReport {
  /**
   * ISO timestamp when the operation completed.
   */
  timestamp: string;

  /**
   * Summary of the operation.
   * Always present (use zeroed values when no work was done).
   */
  summary: OperationSummary;
}

/**
 * Base interface for per-version reports.
 * Used by analyze and mirror for version-specific results.
 */
export interface BaseVersionReport {
  /**
   * The Unicode version this report is for.
   */
  version: string;

  /**
   * File counts for this version.
   */
  counts: FileCounts;

  /**
   * Computed metrics for this version.
   */
  metrics: OperationMetrics;

  /**
   * Errors encountered during processing.
   * Always present (empty array when no errors).
   */
  errors: ReportError[];
}

// =============================================================================
// Helper functions for creating report structures
// =============================================================================

/**
 * Creates a zeroed FileCounts object.
 */
export function createEmptyFileCounts(): FileCounts {
  return {
    total: 0,
    success: 0,
    skipped: 0,
    failed: 0,
  };
}

/**
 * Creates a zeroed OperationMetrics object.
 */
export function createEmptyOperationMetrics(): OperationMetrics {
  return {
    successRate: 0,
    cacheHitRate: 0,
    failureRate: 0,
    averageTimePerFile: 0,
  };
}

/**
 * Creates a zeroed StorageMetrics object.
 */
export function createEmptyStorageMetrics(): StorageMetrics {
  return {
    totalSize: "0 B",
    averageFileSize: "0 B",
  };
}

/**
 * Creates a zeroed OperationSummary object.
 */
export function createEmptySummary(duration: number = 0): OperationSummary {
  return {
    duration,
    counts: createEmptyFileCounts(),
    metrics: createEmptyOperationMetrics(),
    storage: createEmptyStorageMetrics(),
  };
}

/**
 * Computes metrics from file counts.
 */
export function computeMetrics(counts: FileCounts, duration: number): OperationMetrics {
  const total = counts.total;
  return {
    successRate: total > 0 ? (counts.success / total) * 100 : 0,
    cacheHitRate: total > 0 ? (counts.skipped / total) * 100 : 0,
    failureRate: total > 0 ? (counts.failed / total) * 100 : 0,
    averageTimePerFile: total > 0 ? duration / total : 0,
  };
}

/**
 * Formats bytes into a human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const clampedI = Math.max(0, Math.min(i, sizes.length - 1));
  const value = bytes / (1024 ** clampedI);

  return `${value.toFixed(2)} ${sizes[clampedI]}`;
}

/**
 * Computes storage metrics from total size and success count.
 */
export function computeStorageMetrics(totalBytes: number, successCount: number): StorageMetrics {
  return {
    totalSize: formatBytes(totalBytes),
    averageFileSize: successCount > 0 ? formatBytes(totalBytes / successCount) : "0 B",
  };
}

/**
 * Aggregates file counts from multiple version reports.
 */
export function aggregateFileCounts(versionReports: Map<string, BaseVersionReport>): FileCounts {
  const counts = createEmptyFileCounts();

  for (const report of versionReports.values()) {
    counts.total += report.counts.total;
    counts.success += report.counts.success;
    counts.skipped += report.counts.skipped;
    counts.failed += report.counts.failed;
  }

  return counts;
}

/**
 * Creates a full summary from version reports and timing data.
 */
export function createSummaryFromVersionReports(
  versionReports: Map<string, BaseVersionReport>,
  duration: number,
  totalBytes: number,
): OperationSummary {
  const counts = aggregateFileCounts(versionReports);
  return {
    duration,
    counts,
    metrics: computeMetrics(counts, duration),
    storage: computeStorageMetrics(totalBytes, counts.success),
  };
}
