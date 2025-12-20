import { z } from "zod";

/**
 * Schema for a single version entry in the lockfile
 */
const LockfileVersionEntrySchema = z.object({
  /**
   * Path to the snapshot file for this version (relative to basePath)
   */
  path: z.string(),

  /**
   * Number of files in this version
   */
  fileCount: z.number(),

  /**
   * Total size of all files in this version (in bytes)
   */
  totalSize: z.number(),
});

/**
 * Schema for the lockfile structure
 */
export const LockfileSchema = z.object({
  /**
   * Version of the lockfile format
   */
  lockfileVersion: z.literal(1),

  /**
   * Schema identifier for the lockfile format
   */
  schema: z.literal("unicode-mirror-index@1"),

  /**
   * Map of Unicode versions to their snapshot metadata
   */
  versions: z.record(z.string(), LockfileVersionEntrySchema),
});

export type Lockfile = z.output<typeof LockfileSchema>;

/**
 * Schema for a single file entry in a snapshot
 */
const SnapshotFileEntrySchema = z.object({
  /**
   * SHA-256 hash of the file content (format: "sha256:...")
   */
  hash: z.string().regex(/^sha256:[a-f0-9]{64}$/),

  /**
   * Size of the file in bytes
   */
  size: z.number(),
});

/**
 * Schema for a version snapshot
 */
export const SnapshotSchema = z.object({
  /**
   * Schema identifier for the snapshot format
   */
  schema: z.literal("unicode-snapshot@1"),

  /**
   * The Unicode version this snapshot represents
   */
  unicodeVersion: z.string(),

  /**
   * Map of file paths (relative to version directory) to their metadata
   */
  files: z.record(z.string(), SnapshotFileEntrySchema),
});

export type Snapshot = z.output<typeof SnapshotSchema>;
