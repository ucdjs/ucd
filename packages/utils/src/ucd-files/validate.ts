import type { FSAdapter } from "../types";
import path from "node:path";
import { createClient } from "@luxass/unicode-utils-new/fetch";
import defu from "defu";
import { createPathFilter, type FilterFn } from "../filter";
import { createDefaultFSAdapter } from "./fs-adapter";
import { flattenFilePaths } from "./helpers";

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
 * Validates if all required Unicode Character Database (UCD) files for a specific Unicode version
 * are present in the specified directory.
 *
 * This function performs the following:
 * 1. Fetches the list of required files for the specified Unicode version
 * 2. Scans the local directory to find existing files
 * 3. Compares the two sets to identify missing files and files that are not required
 *
 * @param {string} version - The Unicode version number (e.g., "15.0.0")
 * @param {ValidateUCDFilesOptions} options - Configuration options for the validation process
 * @returns {Promise<ValidateUCDFilesResult>} A promise that resolves to an object containing lists of missing files and files that are not required
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
      throw new Error("Version is required for validation");
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

    const requiredFiles = flattenFilePaths(data);

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
