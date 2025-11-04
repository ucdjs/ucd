import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../types";
import { createPathFilter, tryCatch } from "@ucdjs-internal/shared";
import { join } from "pathe";
import { getExpectedFilePaths } from "../core/files";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../errors";
import { getFile } from "./files/get";
import { listFiles } from "./files/list";

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
  mode?: ComparisonMode["type"];
}

/**
 * Comparison mode information
 */
export interface ComparisonMode {
  /**
   * The type of comparison being performed
   */
  type: "local-local" | "local-api" | "api-local" | "api-api";

  /**
   * Whether the 'from' version is available locally
   */
  fromLocal: boolean;

  /**
   * Whether the 'to' version is available locally
   */
  toLocal: boolean;
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
 * Creates a ComparisonMode from a mode type string.
 *
 * @internal
 */
function resolveModeFromType(type: ComparisonMode["type"]): ComparisonMode {
  switch (type) {
    case "local-local":
      return { type: "local-local", fromLocal: true, toLocal: true };
    case "local-api":
      return { type: "local-api", fromLocal: true, toLocal: false };
    case "api-local":
      return { type: "api-local", fromLocal: false, toLocal: true };
    case "api-api":
      return { type: "api-api", fromLocal: false, toLocal: false };
  }
}

interface ResolveComparisonModeParams {
  context: InternalUCDStoreContext;
  fromVersion: string;
  toVersion: string;
  allowApi: boolean;

  manualMode?: ComparisonMode["type"];
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

    // Validate mode requirements
    if (mode.fromLocal && !fromLocal) {
      throw new UCDStoreGenericError(
        `Cannot use mode '${manualMode}': 'from' version '${fromVersion}' is not available locally`,
        { version: fromVersion },
      );
    }

    if (mode.toLocal && !toLocal) {
      throw new UCDStoreGenericError(
        `Cannot use mode '${manualMode}': 'to' version '${toVersion}' is not available locally`,
        { version: toVersion },
      );
    }

    if ((!mode.fromLocal || !mode.toLocal) && !allowApi) {
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
  let type: ComparisonMode["type"];

  if (fromLocal && toLocal) {
    type = "local-local";
  } else if (fromLocal && !toLocal) {
    type = "local-api";
  } else if (!fromLocal && toLocal) {
    type = "api-local";
  } else {
    type = "api-api";
  }

  return {
    type,
    fromLocal,
    toLocal,
  };
}

async function getFileList(
  context: InternalUCDStoreContext,
  version: string,
  isLocal: boolean,
  options?: CompareOptions,
): Promise<string[]> {
  if (isLocal) {
    // Use local file listing - faster, no API calls
    const [files, error] = await listFiles(context, version, {
      allowApi: false,
      filters: options?.filters,
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
      include: options?.filters?.include,
      exclude: options?.filters?.exclude,
    });

    return expectedFiles.filter((path) =>
      context.filter(path) && combinedFilter(path),
    );
  }
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
      throw new Error("Both 'from' and 'to' versions must be specified");
    }

    const allowApi = options.allowApi ?? false;

    const mode = await resolveComparisonMode({
      context,
      fromVersion: options.from,
      toVersion: options.to,
      manualMode: options.mode,
      allowApi,
    });

    // Fetch file lists based on mode
    const [fromFiles, toFiles] = await Promise.all([
      getFileList(context, options.from, mode.fromLocal, options),
      getFileList(context, options.to, mode.toLocal, options),
    ]);

    const fromSet = new Set(fromFiles);
    const toSet = new Set(toFiles);

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
      const results = await Promise.allSettled(
        incommon.map(async (filePath) => {
          // Fetch from content based on mode - use allowApi only if that version needs API
          const [fromContent, fromContentError] = await getFile(
            context,
            options.from,
            filePath,
            { allowApi: !mode.fromLocal, filters: options.filters },
          );

          if (fromContentError != null) {
            throw fromContentError;
          }

          const [toContent, toContentError] = await getFile(
            context,
            options.to,
            filePath,
            { allowApi: !mode.toLocal, filters: options.filters },
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
          const { fromContent, toContent } = result.value;
          if (fromContent === toContent) {
            unchanged.push(result.value.filePath);
          } else {
            modified.push(result.value.filePath);
          }
        }
      }

      if (errors.length > 0) {
        throw errors[0];
      }
    }

    return {
      from: options.from,
      to: options.to,
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
