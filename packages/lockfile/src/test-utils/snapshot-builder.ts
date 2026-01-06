import type { Snapshot } from "@ucdjs/schemas";
import { computeFileHash, computeFileHashWithoutUCDHeader } from "../hash";

export interface CreateSnapshotOptions {
  /**
   * Pre-computed content hashes for files (hash without Unicode header)
   * If not provided, will be computed using computeFileHashWithoutUCDHeader
   */
  hashes?: Record<string, string>;

  /**
   * Pre-computed file hashes for files (hash of complete file)
   * If not provided, will be computed using computeFileHash
   */
  fileHashes?: Record<string, string>;

  /**
   * Pre-computed sizes for files (if not provided, will be computed from content)
   */
  sizes?: Record<string, number>;
}

/**
 * Creates a snapshot for a version with the specified files
 * Automatically computes hashes and sizes if not provided
 *
 * @param version - The Unicode version for this snapshot
 * @param files - Map of file paths to file content
 * @param options - Optional pre-computed values
 */
export async function createSnapshot(
  version: string,
  files: Record<string, string>,
  options?: CreateSnapshotOptions,
): Promise<Snapshot> {
  const snapshotFiles: Snapshot["files"] = {};

  for (const [filePath, content] of Object.entries(files)) {
    const hash = options?.hashes?.[filePath] ?? await computeFileHashWithoutUCDHeader(content);
    const fileHash = options?.fileHashes?.[filePath] ?? await computeFileHash(content);
    const size = options?.sizes?.[filePath] ?? new TextEncoder().encode(content).length;

    snapshotFiles[filePath] = { hash, fileHash, size };
  }

  return {
    unicodeVersion: version,
    files: snapshotFiles,
  };
}

/**
 * Creates a snapshot with pre-computed hashes and sizes
 * Useful when you want to control the exact hash/size values
 *
 * @param version - The Unicode version for this snapshot
 * @param files - Map of file paths to file metadata
 */
export function createSnapshotWithHashes(
  version: string,
  files: Record<string, { hash: string; fileHash: string; size: number }>,
): Snapshot {
  return {
    unicodeVersion: version,
    files: Object.fromEntries(
      Object.entries(files).map(([filePath, { hash, fileHash, size }]) => [
        filePath,
        { hash, fileHash, size },
      ]),
    ),
  };
}

/**
 * Creates an empty snapshot for a version (no files)
 *
 * @param version - The Unicode version for this snapshot
 */
export function createEmptySnapshot(version: string): Snapshot {
  return {
    unicodeVersion: version,
    files: {},
  };
}
