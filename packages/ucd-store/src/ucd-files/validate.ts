import type { PathFilter } from "@ucdjs/utils";
import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import path from "node:path";
import { buildUCDPath } from "@luxass/unicode-utils-new";
import { createClient } from "@ucdjs/fetch";
import { createPathFilter, flattenFilePaths } from "@ucdjs/utils";
import defu from "defu";

export interface ValidateUCDFilesOptions {
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
      fs: await import("@ucdjs/utils/fs-bridge/node").then((m) => m.default).catch(() => {
        throw new Error("Failed to import default file system bridge");
      }),
      patternMatcher: undefined,
      patterns: [],
      apiUrl: "https://api.ucdjs.dev",
      basePath: "./ucd-files",
    } satisfies Partial<ValidateUCDFilesOptions>);

    if (!version) {
      throw new Error("Version is required for validation");
    }

    const client = createClient(apiUrl);

    const versionOutputDir = path.resolve(basePath, `v${version}`);

    const patternMatcher = providedPatternMatcher || createPathFilter(patterns);

    const { data, error, response } = await client.GET("/api/v1/versions/{version}/file-tree", {
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
    const allPaths = await fs.listdir(versionOutputDir, true);

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

export interface RepairUCDFilesOptions {
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
   * Optional proxy URL to use for downloading files.
   * If not provided, defaults to "https://unicode-proxy.ucdjs.dev".
   */
  proxyUrl?: string;
}

export interface RepairUCDFilesResult {
  success: boolean;
  repairedFiles: string[];
  errors: Array<{
    message: string;
    file?: string;
  }>;
}

/**
 * Repairs a UCD files directory by downloading only the missing files for a specific Unicode version.
 *
 * This function is designed to work with the output of `validateUCDFiles` to efficiently download
 * only the files that are missing from the local directory, rather than re-downloading everything.
 *
 * @param {string} version - The Unicode version number (e.g., "15.0.0")
 * @param {string[]} files - Array of file paths that need to be downloaded (typically from validateUCDFiles result)
 * @param {RepairUCDFilesOptions} options - Configuration options for the repair process
 * @returns {Promise<RepairUCDFilesResult>} A promise that resolves to a result object containing success status, repaired files, and any errors
 */
export async function repairUCDFiles(
  version: string,
  files: string[],
  options: RepairUCDFilesOptions = {},
): Promise<RepairUCDFilesResult> {
  const {
    basePath,
    fs,
    proxyUrl,
  } = defu(options, {
    fs: await import("@ucdjs/utils/fs-bridge/node").then((m) => m.default).catch(() => {
      throw new Error("Failed to import default file system bridge");
    }),
    basePath: "./ucd-files",
    proxyUrl: "https://unicode-proxy.ucdjs.dev",
  } satisfies Partial<RepairUCDFilesOptions>);

  if (!version) {
    return {
      success: false,
      repairedFiles: [],
      errors: [{ message: "Version is required for repair" }],
    };
  }

  if (!Array.isArray(files) || files.length === 0) {
    return {
      success: true,
      repairedFiles: [],
      errors: [],
    };
  }

  const versionOutputDir = path.resolve(basePath, `v${version}`);
  const repairedFiles: string[] = [];
  const errors: Array<{ message: string; file?: string }> = [];

  try {
    // ensure the version directory exists
    await fs.mkdir(versionOutputDir);

    // download each missing file
    const downloadPromises = files.map(async (filePath) => {
      try {
        const fullOutputPath = path.join(versionOutputDir, filePath);

        if (!await fs.exists(path.dirname(fullOutputPath))) {
          await fs.mkdir(path.dirname(fullOutputPath));
        }

        // Construct the download URL
        const url = `${proxyUrl}${buildUCDPath(version, filePath)}`;

        const response = await fetch(url);

        if (!response.ok) {
          errors.push({
            message: `Failed to fetch ${filePath}: ${response.status} ${response.statusText}`,
            file: filePath,
          });
          return;
        }

        const content = await response.text();
        await fs.write(fullOutputPath, content);
        repairedFiles.push(filePath);
      } catch (err) {
        errors.push({
          message: `Error downloading ${filePath}: ${(err as any).message}`,
          file: filePath,
        });
      }
    });

    await Promise.all(downloadPromises);

    return {
      success: errors.length === 0,
      repairedFiles,
      errors,
    };
  } catch (err) {
    return {
      success: false,
      repairedFiles,
      errors: [
        ...errors,
        {
          message: `Error during repair process for version ${version}: ${(err as any).message}`,
        },
      ],
    };
  }
}
