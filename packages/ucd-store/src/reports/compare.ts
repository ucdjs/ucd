import type { StoreError } from "../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../types";
import type { OperationResult } from "@ucdjs-internal/shared";
import {
  createConcurrencyLimiter,
  createDebugger,
  wrapTry,
} from "@ucdjs-internal/shared";
import { computeFileHashWithoutUCDHeader } from "@ucdjs/lockfile";
import { isUCDStoreInternalContext } from "../context";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../errors";
import { getFile } from "../files/get";
import { listFiles } from "../files/list";

const debug = createDebugger("ucdjs:ucd-store:compare");

/**
 * Single mode types for comparison.
 * - "prefer-local": Try local first, fall back to API if not found
 * - "local": Only use local files, fail if not present
 * - "api": Only use API, never check local files
 */
export type SingleModeType = "prefer-local" | "local" | "api";

/**
 * Comparison mode configuration.
 * Can be a single mode applied to both versions, or a tuple specifying different modes for from/to.
 *
 * @example
 * // Single mode - same behavior for both versions
 * mode: "prefer-local"
 *
 * @example
 * // Tuple mode - different behavior for from/to
 * mode: ["local", "api"] // from uses local, to uses API
 */
export type ComparisonMode = SingleModeType | readonly [SingleModeType, SingleModeType];

export interface CompareOptions extends SharedOperationOptions {
  /** Version to compare from */
  from: string;

  /** Version to compare to */
  to: string;

  /** Whether to compare file contents using SHA-256 hashes. Defaults to true. */
  includeFileHashes?: boolean;

  /** Concurrency for file reads when computing hashes. Defaults to 5. */
  concurrency?: number;

  /**
   * Comparison mode determining how files are fetched.
   *
   * - "prefer-local" (default): Try local first, fall back to API if not found
   * - "local": Only use local files, fail if not present
   * - "api": Only use API, never check local files
   * - ["fromMode", "toMode"]: Tuple specifying different modes for from/to versions
   *
   * @default "prefer-local"
   */
  mode?: ComparisonMode;
}

/**
 * Change type for modified files.
 * - "content-changed": File content differs (hash mismatch)
 * - "size-only-changed": Only size differs (rare, usually implies content change)
 */
export type FileChangeType = "content-changed" | "size-only-changed";

export interface FileChangeInfo {
  /** The file path */
  file: string;

  /** Type of change detected */
  changeType: FileChangeType;

  /** File metadata from the source version */
  from: {
    /** File size in bytes */
    size: number;
    /** Content hash (SHA-256, computed without UCD header) */
    hash: string;
  };

  /** File metadata from the target version */
  to: {
    /** File size in bytes */
    size: number;
    /** Content hash (SHA-256, computed without UCD header) */
    hash: string;
  };
}

export interface VersionComparison {
  /** The source version being compared from */
  from: string;

  /** The target version being compared to */
  to: string;

  /** Files that were added in the target version */
  added: readonly string[];

  /** Files that were removed from the source version */
  removed: readonly string[];

  /** Files that were modified between versions */
  modified: readonly string[];

  /** Number of files that are unchanged between versions */
  unchanged: number;

  /** Detailed change information for modified files */
  changes: readonly FileChangeInfo[];
}

/**
 * Resolves comparison mode into separate modes for from/to versions.
 */
function resolveModes(mode: ComparisonMode | undefined): { fromMode: SingleModeType; toMode: SingleModeType } {
  if (!mode) {
    return { fromMode: "prefer-local", toMode: "prefer-local" };
  }

  if (Array.isArray(mode)) {
    return { fromMode: mode[0], toMode: mode[1] };
  }

  return { fromMode: mode as SingleModeType, toMode: mode as SingleModeType };
}

/**
 * Converts a mode to the allowApi option for listFiles/getFile.
 * - "prefer-local": allowApi = true (try local first, fall back to API)
 * - "local": allowApi = false (only local)
 * - "api": allowApi = true (API-only, handled by forcing fetch from API)
 */
function modeToAllowApi(mode: SingleModeType): boolean {
  return mode !== "local";
}

/**
 * Normalizes a file path by removing the version prefix.
 * Handles paths like "/16.0.0/UnicodeData.txt" or "16.0.0/UnicodeData.txt"
 */
function normalizeFilePath(filePath: string, version: string): string {
  const versionPrefix = `/${version}/`;
  const versionPrefixNoSlash = `${version}/`;

  if (filePath.startsWith(versionPrefix)) {
    return filePath.slice(versionPrefix.length);
  }

  if (filePath.startsWith(versionPrefixNoSlash)) {
    return filePath.slice(versionPrefixNoSlash.length);
  }

  // Already normalized or doesn't have version prefix
  return filePath.replace(/^\/+/, "");
}

/**
 * Compares two versions in the store and returns a report describing added/removed/modified/unchanged files.
 *
 * The comparison uses content hashes (SHA-256 with Unicode header stripped) to determine
 * if files have actually changed content, not just metadata like version numbers in headers.
 *
 * @this {InternalUCDStoreContext} - Internal store context with client, filters, FS bridge, and configuration
 * @param {CompareOptions} options - Compare options with from/to versions
 * @returns {Promise<OperationResult<VersionComparison, StoreError>>} Operation result with comparison report
 */
async function _compare(
  this: InternalUCDStoreContext,
  options?: CompareOptions,
): Promise<OperationResult<VersionComparison, StoreError>> {
  return wrapTry(async () => {
    if (!options) {
      throw new UCDStoreGenericError("Options with `from` and `to` versions are required");
    }

    const { from, to } = options;

    if (!from || !to) {
      throw new UCDStoreGenericError("Both `from` and `to` versions must be specified");
    }

    if (!this.versions.resolved.includes(from)) {
      throw new UCDStoreVersionNotFoundError(from);
    }

    if (!this.versions.resolved.includes(to)) {
      throw new UCDStoreVersionNotFoundError(to);
    }

    const { fromMode, toMode } = resolveModes(options.mode);
    const includeHashes = options.includeFileHashes !== false; // default true
    const concurrency = options.concurrency ?? 5;

    debug?.("Comparing %s -> %s (modes: %s, %s, includeHashes: %s)", from, to, fromMode, toMode, includeHashes);

    // Fetch file lists for both versions
    const [fromFilesRaw, fromError] = await listFiles(this, from, {
      allowApi: modeToAllowApi(fromMode),
      filters: options.filters,
    });

    if (fromError) {
      throw fromError;
    }

    const [toFilesRaw, toError] = await listFiles(this, to, {
      allowApi: modeToAllowApi(toMode),
      filters: options.filters,
    });

    if (toError) {
      throw toError;
    }

    // Normalize file paths (remove version prefix) and filter out snapshot.json
    const fromFiles = (fromFilesRaw || [])
      .map((p) => normalizeFilePath(p, from))
      .filter((p) => p !== "snapshot.json");

    const toFiles = (toFilesRaw || [])
      .map((p) => normalizeFilePath(p, to))
      .filter((p) => p !== "snapshot.json");

    debug?.("From version %s has %d files, to version %s has %d files", from, fromFiles.length, to, toFiles.length);

    const fromSet = new Set(fromFiles);
    const toSet = new Set(toFiles);

    // Calculate added, removed, and common files
    const added = toFiles.filter((p) => !fromSet.has(p)).sort();
    const removed = fromFiles.filter((p) => !toSet.has(p)).sort();
    const common = fromFiles.filter((p) => toSet.has(p)).sort();

    debug?.("Added: %d, Removed: %d, Common: %d", added.length, removed.length, common.length);

    const modified: string[] = [];
    const changes: FileChangeInfo[] = [];
    let unchangedCount = 0;

    if (includeHashes && common.length > 0) {
      const limit = createConcurrencyLimiter(concurrency);

      await Promise.all(common.map((file) => limit(async () => {
        // Fetch file content from both versions
        const [fromContent, fromFileError] = await getFile(this, from, file, {
          allowApi: modeToAllowApi(fromMode),
        });

        if (fromFileError) {
          debug?.("Failed to get file %s from version %s: %s", file, from, fromFileError.message);
          throw fromFileError;
        }

        const [toContent, toFileError] = await getFile(this, to, file, {
          allowApi: modeToAllowApi(toMode),
        });

        if (toFileError) {
          debug?.("Failed to get file %s from version %s: %s", file, to, toFileError.message);
          throw toFileError;
        }

        // Compute content hashes (without Unicode header for meaningful comparison)
        const fromHash = await computeFileHashWithoutUCDHeader(fromContent);
        const toHash = await computeFileHashWithoutUCDHeader(toContent);

        const fromSize = new TextEncoder().encode(fromContent).length;
        const toSize = new TextEncoder().encode(toContent).length;

        if (fromHash !== toHash) {
          modified.push(file);

          // Determine change type
          const changeType: FileChangeType = "content-changed";

          changes.push({
            file,
            changeType,
            from: {
              size: fromSize,
              hash: fromHash,
            },
            to: {
              size: toSize,
              hash: toHash,
            },
          });

          debug?.("File %s modified: %s -> %s (sizes: %d -> %d)", file, fromHash.slice(0, 16), toHash.slice(0, 16), fromSize, toSize);
        } else {
          unchangedCount++;
        }
      })));
    } else {
      // Without hash comparison, all common files are considered unchanged
      unchangedCount = common.length;
    }

    const result: VersionComparison = {
      from,
      to,
      added: Object.freeze(added),
      removed: Object.freeze(removed),
      modified: Object.freeze(modified.sort()),
      unchanged: unchangedCount,
      changes: Object.freeze(changes.sort((a, b) => a.file.localeCompare(b.file))),
    };

    debug?.(
      "Comparison complete: %d added, %d removed, %d modified, %d unchanged",
      result.added.length,
      result.removed.length,
      result.modified.length,
      result.unchanged,
    );

    return result;
  });
}

export function compare(
  context: InternalUCDStoreContext,
  options?: CompareOptions,
): Promise<OperationResult<VersionComparison, StoreError>>;

export function compare(
  this: InternalUCDStoreContext,
  options?: CompareOptions,
): Promise<OperationResult<VersionComparison, StoreError>>;

export function compare(
  this: InternalUCDStoreContext | void,
  thisOrContext?: InternalUCDStoreContext | CompareOptions,
  options?: CompareOptions,
): Promise<OperationResult<VersionComparison, StoreError>> {
  if (isUCDStoreInternalContext(thisOrContext)) {
    // thisOrContext is the context
    return _compare.call(thisOrContext, options);
  }

  // 'this' is the context
  // 'thisOrContext' is actually the 'options'
  return _compare.call(
    this as InternalUCDStoreContext,
    thisOrContext as CompareOptions,
  );
}
