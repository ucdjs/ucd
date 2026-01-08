import type { PathFilter, PathFilterOptions } from "@ucdjs-internal/shared";
import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type {
  InternalUCDStoreContext,
  UCDStoreContext,
} from "../types";
import { createDebugger } from "@ucdjs-internal/shared";

const debug = createDebugger("ucdjs:ucd-store:context");

/**
 * Creates an internal store context object.
 * This context is used internally by store methods and operations.
 *
 * @internal
 */
export function createInternalContext(options: {
  client: UCDClient;
  filter: PathFilter;
  fs: FileSystemBridge;
  basePath: string;
  versions: string[];
  lockfilePath: string;
}): InternalUCDStoreContext {
  return {
    client: options.client,
    filter: options.filter,
    fs: options.fs,
    basePath: options.basePath,
    versions: [...options.versions],
    lockfilePath: options.lockfilePath,
  };
}

/**
 * Extracts filter patterns from a PathFilter for storage in the lockfile.
 *
 * @param {PathFilter} filter - The path filter to extract patterns from
 * @returns {PathFilterOptions | undefined} The filter options, or undefined if no filters are configured
 * @internal
 */
export function extractFilterPatterns(filter: PathFilter): PathFilterOptions | undefined {
  const patterns = filter.patterns();

  // Return undefined if no filters are configured (empty include/exclude)
  const hasInclude = patterns.include && patterns.include.length > 0;
  const hasExclude = patterns.exclude && patterns.exclude.length > 0;
  const hasDisableDefault = patterns.disableDefaultExclusions === true;

  if (!hasInclude && !hasExclude && !hasDisableDefault) {
    return undefined;
  }

  function ensureArray<T>(value: T | T[]): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  debug?.(`Extracting filter patterns: include=${hasInclude}, exclude=${hasExclude}, disableDefaultExclusions=${hasDisableDefault}`);
  return {
    include: ensureArray(patterns.include!),
    exclude: ensureArray(patterns.exclude!),
    disableDefaultExclusions: patterns.disableDefaultExclusions,
  };
}

/**
 * Creates the public-facing context properties from internal context.
 * This includes only the properties that should be exposed in the public API.
 *
 * @internal
 */
export function createPublicContext(
  context: InternalUCDStoreContext,
): UCDStoreContext {
  return {
    get basePath() {
      return context.basePath;
    },
    get versions() {
      return Object.freeze([...context.versions]);
    },
    get fs() {
      return context.fs;
    },
  };
}
