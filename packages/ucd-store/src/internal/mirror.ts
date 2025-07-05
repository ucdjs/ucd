import type { PathFilter } from "@ucdjs/utils";
import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { createClient } from "@ucdjs/fetch";
import { createPathFilter } from "@ucdjs/utils";
import defu from "defu";
import { internal_mirrorUnicodeVersion } from "./internal";

export interface MirrorOptions {
  /**
   * List of Unicode versions to download files for.
   * Each version should be a string representing the Unicode version (e.g., "15.0.0", "14.0.0").
   */
  versions: string[];

  /**
   * Optional base path where files will be downloaded.
   * Defaults to "./ucd-files" if not provided.
   */
  basePath?: string;

  /**
   * Optional filesystem interface to use for file operations.
   * If not provided, a default implementation NodeJS bridge will be used.
   */
  fs?: FileSystemBridge;

  /**
   * A Pattern matcher function to filter files based on their names.
   * This function should take a file name as input and return true if the file should be included in the download.
   */
  patternMatcher?: PathFilter;

  /**
   * Optional patterns to use for filtering files.
   * This will only be used if `patternMatcher` is not provided.
   * Patterns should be in the format understood by `picomatch`.
   */
  patterns?: string[];

  /**
   * Optional API URL to use for fetching Unicode files.
   * If not provided, defaults to "https://api.ucdjs.dev".
   */
  apiUrl?: string;
}

export interface DownloadError {
  message: string;
  version?: string;
  file?: string;
}

export type MirrorResult = {
  success: true;
  errors: null;
  files: string[];
  locatedFiles: string[];
} | {
  success: false;
  errors: DownloadError[];
  files: string[];
  locatedFiles: string[];
};

/**
 * Mirrors Unicode Character Database (UCD) files from a remote API to local storage.
 *
 * This function downloads UCD files for specified Unicode versions and stores them
 * locally using the provided filesystem bridge. Files can be filtered using patterns
 * or a custom pattern matcher function.
 *
 * @param {MirrorOptions} options - Configuration options for mirroring UCD files
 * @returns {Promise<MirrorResult>} A promise that resolves to a MirrorResult indicating success or failure
 *
 * @example
 * ```typescript
 * // Mirror files for Unicode 15.0.0 and 14.0.0
 * const result = await mirrorUCDFiles({
 *   versions: ["15.0.0", "14.0.0"],
 *   basePath: "./unicode-data",
 *   patterns: ["*.txt", "*.xml"]
 * });
 *
 * if (result.success) {
 *   console.log(`Downloaded ${result.files.length} files`);
 * } else {
 *   console.error("Download failed:", result.errors);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Mirror with custom pattern matcher
 * const result = await mirrorUCDFiles({
 *   versions: ["15.0.0"],
 *   patternMatcher: (filename) => filename.includes("PropertyValueAliases")
 * });
 * ```
 *
 * @remarks
 * The function will:
 * - Download files for each specified Unicode version
 * - Apply pattern filtering if patterns or patternMatcher are provided
 * - Return aggregated results from all version downloads
 * - Handle errors gracefully and return them in the result object
 *
 * If any errors occur during the download process, the function will return
 * `success: false` with detailed error information in the `errors` array.
 */
export async function mirrorUCDFiles(options: MirrorOptions): Promise<MirrorResult> {
  const {
    versions,
    basePath,
    fs,
    patternMatcher: providedPatternMatcher,
    patterns,
    apiUrl,
  } = defu(options, {
    basePath: "./ucd-files",
    fs: await import("@ucdjs/utils/fs-bridge/node").then((m) => m.default).catch(() => {
      throw new Error("Failed to import default file system bridge");
    }),
    patternMatcher: undefined,
    patterns: [],
    apiUrl: "https://api.ucdjs.dev",
    versions: [],
  } satisfies MirrorOptions);

  const client = createClient(apiUrl);

  if (!Array.isArray(versions) || versions.length === 0) {
    return {
      success: false,
      errors: [{ message: "No Unicode versions provided" }],
      files: [],
      locatedFiles: [],
    };
  }

  const patternMatcher = providedPatternMatcher || createPathFilter(patterns);

  const promises = versions.map((version) => {
    return internal_mirrorUnicodeVersion(version, {
      basePath,
      fs,
      patternMatcher,
      client,
      apiUrl,
    });
  });

  const allResults = await Promise.all(promises);

  const locatedFiles = allResults.flatMap((result) => result.locatedFiles);
  const files = allResults.flatMap((result) => result.files);
  const errors = allResults.flatMap((result) => result.errors);
  const hasErrors = errors.length > 0;
  if (hasErrors) {
    return {
      success: false,
      errors,
      files,
      locatedFiles,
    };
  }

  return {
    success: true,
    errors: null,
    files,
    locatedFiles,
  };
}
