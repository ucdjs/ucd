import type {
  BaseVersionReport,
  FileCounts,
  OperationMetrics,
  OperationSummary,
  StorageMetrics,
} from "../types";

export function createEmptyFileCounts(): FileCounts {
  return {
    total: 0,
    success: 0,
    skipped: 0,
    failed: 0,
  };
}

export function createEmptyOperationMetrics(): OperationMetrics {
  return {
    successRate: 0,
    cacheHitRate: 0,
    failureRate: 0,
    averageTimePerFile: 0,
  };
}

export function createEmptyStorageMetrics(): StorageMetrics {
  return {
    totalSize: "0 B",
    averageFileSize: "0 B",
  };
}

export function createEmptySummary(duration: number = 0): OperationSummary {
  return {
    duration,
    counts: createEmptyFileCounts(),
    metrics: createEmptyOperationMetrics(),
    storage: createEmptyStorageMetrics(),
  };
}

export function computeMetrics(counts: FileCounts, duration: number): OperationMetrics {
  const total = counts.total;
  return {
    successRate: total > 0 ? (counts.success / total) * 100 : 0,
    cacheHitRate: total > 0 ? (counts.skipped / total) * 100 : 0,
    failureRate: total > 0 ? (counts.failed / total) * 100 : 0,
    averageTimePerFile: total > 0 ? duration / total : 0,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const clampedI = Math.max(0, Math.min(i, sizes.length - 1));
  const value = bytes / (1024 ** clampedI);

  return `${value.toFixed(2)} ${sizes[clampedI]}`;
}

export function computeStorageMetrics(totalBytes: number, successCount: number): StorageMetrics {
  return {
    totalSize: formatBytes(totalBytes),
    averageFileSize: successCount > 0 ? formatBytes(totalBytes / successCount) : "0 B",
  };
}

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
