import type { Snapshot } from "@ucdjs/schemas";
import { computeFileHash } from "../hash";

export interface CreateSnapshotOptions {
  /**
   * Pre-computed hashes for files (if not provided, will be computed)
   */
  hashes?: Record<string, string>;

  /**
   * Pre-computed sizes for files (if not provided, will be computed from content)
   */
  sizes?: Record<string, number>;
}

/**
 * Creates a snapshot for a version with the specified files
 * Automatically computes hashes and sizes if not provided
 */
export async function createSnapshot(
  version: string,
  files: Record<string, string>,
  options?: CreateSnapshotOptions,
): Promise<Snapshot> {
  const snapshotFiles: Snapshot["files"] = {};

  for (const [filePath, content] of Object.entries(files)) {
    const hash = options?.hashes?.[filePath] ?? await computeFileHash(content);
    const size = options?.sizes?.[filePath] ?? new TextEncoder().encode(content).length;

    snapshotFiles[filePath] = { hash, size };
  }

  return {
    unicodeVersion: version,
    files: snapshotFiles,
  };
}

/**
 * Creates a snapshot with pre-computed hashes and sizes
 * Useful when you want to control the exact hash/size values
 */
export function createSnapshotWithHashes(
  version: string,
  files: Record<string, { content: string; hash: string; size: number }>,
): Snapshot {
  return {
    unicodeVersion: version,
    files: Object.fromEntries(
      Object.entries(files).map(([filePath, { hash, size }]) => [
        filePath,
        { hash, size },
      ]),
    ),
  };
}

