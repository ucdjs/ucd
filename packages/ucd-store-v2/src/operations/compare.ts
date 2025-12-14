import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../types";
import { createDebugger, createPathFilter, tryCatch } from "@ucdjs-internal/shared";
import { join } from "pathe";
import { getExpectedFilePaths } from "../core/files";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../errors";
import { getFileInternal } from "./files/get";
import { listFiles } from "./files/list";

const debug = createDebugger("ucdjs:ucd-store:compare");

type SingleModeType = "local" | "api";

/**
 * Comparison mode as a tuple indicating the source for each version.
 * - First element: source for 'from' version ("local" or "api")
 * - Second element: source for 'to' version ("local" or "api")
 *
 * @example
 * ["local", "local"] // Both versions from local storage
 * ["local", "api"]   // From local, to from API
 * ["api", "local"]   // From API, to from local
 * ["api", "api"]     // Both versions from API
 */
export type ComparisonMode = [from: SingleModeType, to: SingleModeType];
export type ComparisonModeType = `${SingleModeType}-${SingleModeType}`;

export interface CompareOptions extends SharedOperationOptions {
  /**
   * Start version for comparison (inclusive)
   */
  from: string;

  /**
   * End version for comparison (inclusive)
   */
  to: string;

  /**
   * Whether to allow falling back to API if files are not found in local store
   * @default false
   */
  allowApi?: boolean;

  /**
   * Manually specify the comparison mode instead of auto-detecting.
   * Useful when you want to force a specific comparison strategy.
   *
   * Examples:
   * - "local-local": Force comparing local files only
   * - "api-api": Force comparing from API (get canonical file lists)
   * - "local-api": Force from to be local, to to be from API
   *
   * @default undefined (auto-detect based on version availability)
   */
  mode?: ComparisonModeType;
}

export interface VersionComparison {
  /**
   * The version being compared from
   */
  from: string;

  /**
   * The version being compared to
   */
  to: string;

  /**
   * File lists grouped by change type
   */
  files: {
    /**
     * Files that were added in the 'to' version
     */
    added: readonly string[];

    /**
     * Files that were removed in the 'to' version
     */
    removed: readonly string[];

    /**
     * Files that were modified between versions
     */
    modified: readonly string[];

    /**
     * Files that are unchanged between versions
     */
    unchanged: readonly string[];
  };

  /**
   * Summary counts of the comparison
   */
  counts: {
    /**
     * Total number of files in the 'from' version
     */
    fromTotal: number;

    /**
     * Total number of files in the 'to' version
     */
    toTotal: number;

    /**
     * Number of files added in 'to' version
     */
    added: number;

    /**
     * Number of files removed in 'to' version
     */
    removed: number;

    /**
     * Number of files that were modified
     */
    modified: number;

    /**
     * Number of files that are unchanged
     */
    unchanged: number;
  };
}

/**
 * Compare two versions in the store
 *
 * @param {InternalUCDStoreContext} context - Internal store context
 * @param {CompareOptions} [options] - Compare options
 * @returns {Promise<OperationResult<VersionComparison, StoreError>>} Operation result
 */
export async function compare(
  context: InternalUCDStoreContext,
  options?: CompareOptions,
): Promise<OperationResult<VersionComparison, StoreError>> {
  return tryCatch(async () => {
    if (!options?.from || !options?.to) {
      throw new UCDStoreGenericError("Both 'from' and 'to' versions must be specified");
    }

    const { from, to, allowApi = false, filters, mode: manualMode } = options;

    debug?.("Comparing versions", from, "to", to, "allowApi:", allowApi, "mode:", manualMode);

    // Resolve comparison mode (auto-detect or validate manual mode)
    const [fromSource, toSource] = await resolveComparisonMode({
      context,
      fromVersion: from,
      toVersion: to,
      manualMode,
      allowApi,
    });

    debug?.("Resolved comparison mode:", fromSource, "-", toSource);

    // Get file lists for both versions based on resolved mode
    const [fromFilesRaw, toFilesRaw] = await Promise.all([
      getFileList(context, from, fromSource === "local", filters),
      getFileList(context, to, toSource === "local", filters),
    ]);

    // Only fetch expected file paths for API sources; for local, use the actual local list
    const [expectedFromFiles, expectedToFiles] = await Promise.all([
      fromSource === "api"
        ? getExpectedFilePaths(context.client, from)
        : fromFilesRaw,
      toSource === "api"
        ? getExpectedFilePaths(context.client, to)
        : toFilesRaw,
    ]);

    const expectedFromSet = new Set(expectedFromFiles);
    const expectedToSet = new Set(expectedToFiles);

    // Filter out any orphaned paths that are not part of the expected set
    const fromFiles = fromFilesRaw.filter((file) => expectedFromSet.has(file));
    const toFiles = toFilesRaw.filter((file) => expectedToSet.has(file));

    debug?.("From files count:", fromFiles.length, "To files count:", toFiles.length);

    // Create sets for efficient lookup
    const fromSet = new Set(fromFiles);
    const toSet = new Set(toFiles);

    // Categorize files
    const added: string[] = [];
    const removed: string[] = [];
    const incommon: string[] = [];

    for (const file of toFiles) {
      if (!fromSet.has(file)) {
        added.push(file);
      } else {
        incommon.push(file);
      }
    }

    for (const file of fromFiles) {
      if (!toSet.has(file)) {
        removed.push(file);
      }
    }

    // Compare content of common files to detect modifications
    const modified: string[] = [];
    const unchanged: string[] = [];

    if (incommon.length > 0) {
      debug?.("Comparing", incommon.length, "common files for modifications");

      const results = await Promise.allSettled(
        incommon.map(async (filePath) => {
          // Fetch content based on mode - use allowApi only if that version needs API
          // Use skipVersionCheck when in API mode since the version may not exist locally
          const [fromContent, fromContentError] = await getFileInternal(
            context,
            from,
            filePath,
            {
              allowApi: fromSource === "api",
              skipVersionCheck: fromSource === "api",
              filters,
            },
          );

          if (fromContentError != null) {
            throw fromContentError;
          }

          const [toContent, toContentError] = await getFileInternal(
            context,
            to,
            filePath,
            {
              allowApi: toSource === "api",
              skipVersionCheck: toSource === "api",
              filters,
            },
          );

          if (toContentError != null) {
            throw toContentError;
          }

          return { filePath, fromContent, toContent };
        }),
      );

      // Process results and collect any errors
      const errors: StoreError[] = [];
      for (const result of results) {
        if (result.status === "rejected") {
          errors.push(result.reason);
        } else {
          const { filePath, fromContent, toContent } = result.value;
          if (fromContent === toContent) {
            unchanged.push(filePath);
          } else {
            modified.push(filePath);
          }
        }
      }

      if (errors.length > 0) {
        throw errors[0];
      }
    }

    debug?.("Comparison complete - added:", added.length, "removed:", removed.length, "modified:", modified.length, "unchanged:", unchanged.length);

    return {
      from,
      to,
      files: {
        added: Object.freeze(added),
        removed: Object.freeze(removed),
        modified: Object.freeze(modified),
        unchanged: Object.freeze(unchanged),
      },
      counts: {
        fromTotal: fromFiles.length,
        toTotal: toFiles.length,
        added: added.length,
        removed: removed.length,
        modified: modified.length,
        unchanged: unchanged.length,
      },
    } satisfies VersionComparison;
  });
}

/**
 * @internal
 */
function resolveModeFromType(type: ComparisonModeType): ComparisonMode {
  switch (type) {
    case "local-local":
      return ["local", "local"];
    case "local-api":
      return ["local", "api"];
    case "api-local":
      return ["api", "local"];
    case "api-api":
      return ["api", "api"];
  }
}

interface ResolveComparisonModeParams {
  context: InternalUCDStoreContext;
  fromVersion: string;
  toVersion: string;
  allowApi: boolean;
  manualMode?: ComparisonModeType;
}

/**
 * Determines or validates the comparison mode based on version availability.
 *
 * If a manual mode is specified, it validates that the mode is viable given
 * the current version availability and allowApi setting. Otherwise, it
 * auto-detects the appropriate mode.
 *
 * @internal
 */
export async function resolveComparisonMode({
  allowApi,
  context,
  fromVersion,
  toVersion,
  manualMode,
}: ResolveComparisonModeParams): Promise<ComparisonMode> {
  // Check version availability once
  const fromInStore = context.versions.includes(fromVersion);
  const toInStore = context.versions.includes(toVersion);

  const fromLocalPath = join(context.basePath, fromVersion);
  const toLocalPath = join(context.basePath, toVersion);

  const [fromExists, toExists] = await Promise.all([
    context.fs.exists(fromLocalPath),
    context.fs.exists(toLocalPath),
  ]);

  const fromLocal = fromInStore && fromExists;
  const toLocal = toInStore && toExists;

  // If manual mode is specified, validate and use it
  if (manualMode) {
    const mode = resolveModeFromType(manualMode);
    const [fromSource, toSource] = mode;

    // Validate mode requirements
    if (fromSource === "local" && !fromLocal) {
      throw new UCDStoreGenericError(
        `Cannot use mode '${manualMode}': 'from' version '${fromVersion}' is not available locally`,
        { version: fromVersion },
      );
    }

    if (toSource === "local" && !toLocal) {
      throw new UCDStoreGenericError(
        `Cannot use mode '${manualMode}': 'to' version '${toVersion}' is not available locally`,
        { version: toVersion },
      );
    }

    if ((fromSource === "api" || toSource === "api") && !allowApi) {
      throw new UCDStoreGenericError(
        `Cannot use mode '${manualMode}': requires API access but allowApi is false`,
      );
    }

    return mode;
  }

  // Auto-detect mode if not specified
  if (!allowApi) {
    if (!fromLocal) {
      throw new UCDStoreVersionNotFoundError(fromVersion);
    }
    if (!toLocal) {
      throw new UCDStoreVersionNotFoundError(toVersion);
    }
  }

  // Determine mode based on availability
  if (fromLocal && toLocal) {
    return ["local", "local"];
  } else if (fromLocal && !toLocal) {
    return ["local", "api"];
  } else if (!fromLocal && toLocal) {
    return ["api", "local"];
  } else {
    return ["api", "api"];
  }
}

/**
 * Get file list for a version from local storage or API
 *
 * @internal
 */
async function getFileList(
  context: InternalUCDStoreContext,
  version: string,
  isLocal: boolean,
  filters?: CompareOptions["filters"],
): Promise<string[]> {
  if (isLocal) {
    // Use local file listing - faster, no API calls
    const [files, error] = await listFiles(context, version, {
      allowApi: false,
      filters,
    });

    if (error != null) {
      throw error;
    }

    return files;
  } else {
    // Fetch from API - get canonical file list
    const expectedFiles = await getExpectedFilePaths(context.client, version);

    // Apply global filters + optional method-specific filters
    const combinedFilter = createPathFilter({
      include: filters?.include,
      exclude: filters?.exclude,
    });

    return expectedFiles.filter((path) =>
      context.filter(path) && combinedFilter(path),
    );
  }
}
