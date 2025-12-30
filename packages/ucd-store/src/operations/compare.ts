import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../types";
import { createConcurrencyLimiter, createDebugger, wrapTry } from "@ucdjs-internal/shared";
import { computeContentHash } from "@ucdjs/lockfile";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../errors";
import { getFile } from "./files/get";
import { listFiles } from "./files/list";

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

export interface FileChangeInfo {
  /** The file path */
  file: string;
  /** File metadata from the source version */
  from: {
    /** File size in bytes */
    size: number;
  };
  /** File metadata from the target version */
  to: {
    /** File size in bytes */
    size: number;
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
 * - "api": allowApi = true (will need special handling to skip local)
 */
function modeToAllowApi(mode: SingleModeType): boolean {
  return mode !== "local";
}

/**
 * Compares two versions in the store and returns a report describing added/removed/modified/unchanged files.
 */
export async function compare(
  context: InternalUCDStoreContext,
  options?: CompareOptions,
): Promise<OperationResult<VersionComparison, StoreError>> {
  return wrapTry(async () => {
    if (!options) {
      throw new UCDStoreGenericError("Options with `from` and `to` versions are required");
    }

    const from = options.from;
    const to = options.to;

    if (!from || !to) {
      throw new UCDStoreGenericError("Both `from` and `to` versions must be specified");
    }

    if (!context.versions.resolved.includes(from)) {
      throw new UCDStoreVersionNotFoundError(from);
    }

    if (!context.versions.resolved.includes(to)) {
      throw new UCDStoreVersionNotFoundError(to);
    }

    const { fromMode, toMode } = resolveModes(options.mode);
    debug?.("Comparing %s -> %s (modes: %s, %s)", from, to, fromMode, toMode);

    const [fromFiles, fromError] = await listFiles(context, from, {
      allowApi: modeToAllowApi(fromMode),
      filters: options.filters,
    });
    if (fromError) throw fromError;

    const [toFiles, toError] = await listFiles(context, to, {
      allowApi: modeToAllowApi(toMode),
      filters: options.filters,
    });
    if (toError) throw toError;

    const fromList = (fromFiles || []).filter((p) => p !== "snapshot.json");
    const toList = (toFiles || []).filter((p) => p !== "snapshot.json");

    const fromSet = new Set(fromList);
    const toSet = new Set(toList);

    const added = toList.filter((p) => !fromSet.has(p)).sort();
    const removed = fromList.filter((p) => !toSet.has(p)).sort();
    const common = fromList.filter((p) => toSet.has(p)).sort();

    const modified: string[] = [];
    const changes: FileChangeInfo[] = [];
    let unchangedCount = 0;

    const includeHashes = options.includeFileHashes !== false; // default true

    if (includeHashes && common.length > 0) {
      const concurrency = options.concurrency ?? 5;
      const limit = createConcurrencyLimiter(concurrency);

      await Promise.all(common.map((file) => limit(async () => {
        const [fromContent, fErr] = await getFile(context, from, file, {
          allowApi: modeToAllowApi(fromMode),
          cache: false,
        });
        if (fErr) throw fErr;

        const [toContent, tErr] = await getFile(context, to, file, {
          allowApi: modeToAllowApi(toMode),
          cache: false,
        });
        if (tErr) throw tErr;

        const fromHash = await computeContentHash(fromContent);
        const toHash = await computeContentHash(toContent);

        if (fromHash !== toHash) {
          modified.push(file);
          changes.push({
            file,
            from: {
              size: new TextEncoder().encode(fromContent).length,
            },
            to: {
              size: new TextEncoder().encode(toContent).length,
            },
          });
        } else {
          unchangedCount++;
        }
      })));
    } else {
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

    return result;
  });
}
