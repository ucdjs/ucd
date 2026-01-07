import { z } from "zod";

/**
 * Schema for ISO 8601 date strings that coerces to Date objects.
 * Accepts ISO date strings, numbers (timestamps), or Date objects as input.
 * Always outputs a Date object after parsing.
 */
const DateSchema = z.coerce.date();

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

  /**
   * When this version entry was first created
   */
  createdAt: DateSchema,

  /**
   * When this version entry was last updated
   */
  updatedAt: DateSchema,
});

/**
 * Schema for filters applied when creating/updating the lockfile.
 */
const LockfileFiltersSchema = z.object({
  /**
   * Glob patterns for files to include
   */
  include: z.array(z.string()).optional(),

  /**
   * Glob patterns for files to exclude
   */
  exclude: z.array(z.string()).optional(),

  /**
   * Whether default exclusions (.zip, .pdf) were disabled
   */
  disableDefaultExclusions: z.boolean().optional(),
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
   * When this lockfile was first created
   */
  createdAt: DateSchema,

  /**
   * When this lockfile was last updated
   */
  updatedAt: DateSchema,

  /**
   * Map of Unicode versions to their snapshot metadata
   */
  versions: z.record(z.string(), LockfileVersionEntrySchema),

  /**
   * Filters that were applied when creating/updating this lockfile.
   * This helps track which files were excluded and why.
   */
  filters: LockfileFiltersSchema.optional(),
});

export type Lockfile = z.output<typeof LockfileSchema>;
export type LockfileInput = z.input<typeof LockfileSchema>;

/**
 * Schema for a single file entry in a snapshot
 */
const SnapshotFileEntrySchema = z.object({
  /**
   * SHA-256 hash of the file content without the Unicode header (format: "sha256:...").
   * This hash is used for comparing content across versions, since the header
   * contains version-specific information (version number, date, copyright year).
   */
  hash: z.string().regex(/^sha256:[a-f0-9]{64}$/),

  /**
   * SHA-256 hash of the complete file including headers (format: "sha256:...").
   * This hash represents the actual file on disk.
   */
  fileHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),

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
