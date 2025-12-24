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
  fileCount: z.int().nonnegative(),

  /**
   * Total size of all files in this version (in bytes)
   */
  totalSize: z.int().nonnegative(),
});

/**
 * Schema for filters applied when creating/updating the lockfile
 */
const LockfileFiltersSchema = z.object({
  /**
   * Glob patterns for files to include
   */
  include: z.array(z.string()).default([]),

  /**
   * Glob patterns for files to exclude
   */
  exclude: z.array(z.string()).default([]),

  /**
   * Whether default exclusions (.zip, .pdf) were disabled
   */
  disableDefaultExclusions: z.boolean().default(false),
}).default({
  include: [],
  exclude: [],
  disableDefaultExclusions: false,
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
   * Map of Unicode versions to their snapshot metadata
   */
  versions: z.record(z.string(), LockfileVersionEntrySchema),

  /**
   * Filters that were applied when creating/updating this lockfile.
   * This helps track which files were excluded and why.
   */
  filters: LockfileFiltersSchema,
});

export type Lockfile = z.output<typeof LockfileSchema>;
export type LockfileInput = z.input<typeof LockfileSchema>;

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
  size: z.int().nonnegative(),
});

/**
 * Schema for a version snapshot
 */
export const SnapshotSchema = z.object({
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
