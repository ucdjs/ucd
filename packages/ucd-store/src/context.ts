import type { PathFilter, PathFilterOptions } from "@ucdjs-internal/shared";
import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { ExpectedFile } from "@ucdjs/schemas";
import type {
  InternalUCDStoreContext,
  UCDStoreContext,
} from "./types";
import { createDebugger } from "@ucdjs-internal/shared";
import { UCDStoreGenericError } from "./errors";

const debug = createDebugger("ucdjs:ucd-store:context");

interface CreateInternalContextOptions {
  client: UCDClient;
  filter: PathFilter;
  fs: FileSystemBridge;

  lockfile: {
    supports: boolean;
    exists: boolean;
    path: string;
  };

  versions: {
    userProvided: readonly string[];
    configFile: readonly string[];
    /**
     * Pre-resolved versions (optional).
     * If not provided, `resolved` will be an empty mutable array.
     * In production, `store.ts` sets this after determining the version source.
     * In tests, this can be set directly.
     */
    resolved?: readonly string[];
  };
}

/**
 * Creates an internal store context object.
 * This context is used internally by store methods and operations.
 *
 * @internal
 */
export function createInternalContext(options: CreateInternalContextOptions): InternalUCDStoreContext {
  // Cache for API versions (lazy loaded)
  let apiVersionsCache: readonly string[] | null = null;

  return {
    client: options.client,
    filter: options.filter,
    fs: options.fs,
    lockfile: {
      supports: options.lockfile.supports,
      exists: options.lockfile.exists,
      path: options.lockfile.path,
    },
    versions: {
      userProvided: Object.freeze([...options.versions.userProvided]),
      configFile: Object.freeze([...options.versions.configFile]),
      resolved: options.versions.resolved ? [...options.versions.resolved] : [],
      async apiVersions() {
        if (apiVersionsCache !== null) {
          debug?.("Using cached API versions");
          return apiVersionsCache;
        }

        debug?.("Fetching API versions");
        const result = await options.client.versions.list();

        if (result.error || !result.data) {
          debug?.("Failed to fetch API versions:", result.error);
          // Return empty array on error - caller should handle validation
          apiVersionsCache = Object.freeze([] as string[]);
          return apiVersionsCache;
        }

        // Extract version strings from the version objects
        const versionStrings = result.data.map((v) => v.version);
        apiVersionsCache = Object.freeze(versionStrings);
        debug?.("Cached API versions:", apiVersionsCache);
        return apiVersionsCache;
      },
    },
    async getExpectedFilePaths(version: string): Promise<ExpectedFile[]> {
      debug?.("Fetching expected files for version:", version);
      const result = await options.client.manifest.get(version);

      if (result.error) {
        throw new UCDStoreGenericError(
          `Failed to fetch expected files for version '${version}': ${result.error.message}`,
          { version, status: result.error.status },
        );
      }

      if (!result.data) {
        throw new UCDStoreGenericError(
          `Failed to fetch expected files for version '${version}': empty response`,
          { version },
        );
      }

      if (!Array.isArray(result.data.expectedFiles)) {
        throw new UCDStoreGenericError(
          `Failed to fetch expected files for version '${version}': invalid response (missing expectedFiles)`,
          { version },
        );
      }

      return result.data.expectedFiles;
    },
  };
}

export function isUCDStoreInternalContext(obj: unknown): obj is InternalUCDStoreContext {
  return !!obj && typeof obj === "object"
    && "versions" in obj
    && typeof obj.versions === "object"
    && obj.versions != null && "resolved" in obj.versions
    && Array.isArray(obj.versions?.resolved);
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
    get versions() {
      return Object.freeze([...context.versions.resolved]);
    },
    get fs() {
      return context.fs;
    },
  };
}
