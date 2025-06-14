import type { FSAdapter } from "../types";
import path from "node:path";
import { createClient } from "@luxass/unicode-utils-new/fetch";
import defu from "defu";
import { createPathFilter, type FilterFn } from "../filter";
import { createDefaultFSAdapter } from "./fs-adapter";
import { internal__flattenFilePaths } from "./internal";

export interface ValidateUCDFilesOptions {
  /**
   * Optional base path where files will be downloaded.
   * Defaults to "./ucd-files" if not provided.
   */
  basePath?: string;

  /**
   * Optional filesystem interface to use for file operations.
   * If not provided, a default implementation using fs-extra will be used.
   */
  fs?: FSAdapter;

  /**
   * A Pattern matcher function to filter files based on their names.
   * This function should take a file name as input and return true if the file should be included in the download.
   */
  patternMatcher?: FilterFn;

  /**
   * Optional patterns to use for filtering files.
   * This will only be used if `patternMatcher` is not provided.
   * Patterns should be in the format understood by `picomatch`.
   */
  patterns?: string[];

  /**
   * Optional API URL to use for fetching Unicode files.
   * If not provided, defaults to "https://unicode-api.luxass.dev".
   */
  apiUrl?: string;
}

export interface ValidateUCDFilesResult {
  missingFiles: string[];
  // TODO: find a better name for this
  notRequiredFiles: string[];
}

/**
 * Validates if all required Unicode Character Database (UCD) files for a specific version
 * are present in the specified directory.
 *
 * This function checks if all the files that should be present for a given Unicode version
 * are actually available in the local file system. It fetches the list of expected files
 * from the Unicode API and compares it against the local files.
 *
 * @param {ValidateUCDFilesOptions} options - Configuration options for file validation
 * @param options.version - Unicode version to validate files for (e.g., "15.0.0")
 * @param options.basePath - Base directory where Unicode files are stored
 * @param options.fs - Optional filesystem adapter for file operations
 * @param options.patternMatcher - Optional function to filter files based on patterns
 * @param options.patterns - Optional patterns to filter files if patternMatcher isn't provided
 * @param options.apiUrl - Optional API URL to fetch Unicode file listings from
 *
 * @returns {Promise<ValidateUCDFilesResult>} A promise that resolves to an array of missing file paths relative to the version directory.
 *          An empty array indicates all required files are present.
 * @throws Error if version or basePath are not provided
 * @throws Error if the API request to fetch the file list fails
 * @throws TypeError if the API response format is invalid
 */
export async function validateUCDFiles(version: string, options: ValidateUCDFilesOptions): Promise<ValidateUCDFilesResult> {
  try {
    const {
      basePath,
      fs,
      patternMatcher: providedPatternMatcher,
      patterns,
      apiUrl,
    } = defu(options, {
      fs: await createDefaultFSAdapter(),
      patternMatcher: undefined,
      patterns: [],
      apiUrl: "https://unicode-api.luxass.dev",
      basePath: "./ucd-files",
    } satisfies Partial<ValidateUCDFilesOptions>);

    if (!version) {
      throw new Error("Version and basePath are required for validation");
    }

    const client = createClient(apiUrl);

    const versionOutputDir = path.resolve(basePath, `v${version}`);

    const patternMatcher = providedPatternMatcher || createPathFilter(patterns);

    const { data, error, response } = await client.GET("/api/v1/unicode-files/{version}", {
      params: {
        path: {
          version,
        },
      },
    });

    if (error != null || !response.ok) {
      throw new Error(`Failed to fetch file list for version ${version}: ${response.status} ${response.statusText}`);
    }

    if (!Array.isArray(data)) {
      throw new TypeError(`Invalid response format for version ${version}`);
    }

    const requiredFiles = internal__flattenFilePaths(data);

    // Get all files, including those in subdirectories
    const allPaths = await fs.readdir(versionOutputDir, true);

    // Filter out directories, keeping only actual files
    const files = allPaths.filter((filePath) => {
      // A pure directory path would have been included as part of a file path
      // Check if this path itself is present as a prefix in any other path
      return !allPaths.some((otherPath) =>
        otherPath !== filePath && otherPath.startsWith(`${filePath}/`),
      );
    });

    const missingFiles = requiredFiles.filter((file) => {
      const filePath = path.join(versionOutputDir, file);
      if (!patternMatcher(filePath)) return false;
      return !files.includes(file);
    });

    const notRequiredFiles = files.filter((file) => {
      const filePath = path.join(versionOutputDir, file);
      if (!patternMatcher(filePath)) return true;
      return !requiredFiles.includes(file);
    });

    return {
      missingFiles,
      notRequiredFiles,
    };
  } catch (err) {
    console.error("[ucd-files] Error validating UCD files:", err);
    return {
      missingFiles: [],
      notRequiredFiles: [],
    };
  }
}
