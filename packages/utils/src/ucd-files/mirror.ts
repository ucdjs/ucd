import type { FileSystemBridge } from "../fs-bridge";
import { createClient } from "@luxass/unicode-utils-new/fetch";
import defu from "defu";
import { createPathFilter, type PathFilter } from "../filter";
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
   * If not provided, a default implementation using fs-extra will be used.
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
   * If not provided, defaults to "https://unicode-api.luxass.dev".
   */
  apiUrl?: string;

  /**
   * Optional proxy URL to use for downloading files.
   * If not provided, defaults to "https://unicode-proxy.ucdjs.dev".
   */
  proxyUrl?: string;
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

export async function mirrorUCDFiles(options: MirrorOptions): Promise<MirrorResult> {
  const {
    versions,
    basePath,
    fs,
    patternMatcher: providedPatternMatcher,
    patterns,
    apiUrl,
    proxyUrl,
  } = defu(options, {
    basePath: "./ucd-files",
    fs: await import("../fs-bridge/node").then((m) => m.default).catch(() => {
      throw new Error("Failed to import default file system bridge");
    }),
    patternMatcher: undefined,
    patterns: [],
    apiUrl: "https://unicode-api.luxass.dev",
    versions: [],
    proxyUrl: "https://unicode-proxy.ucdjs.dev",
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
      proxyUrl,
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
