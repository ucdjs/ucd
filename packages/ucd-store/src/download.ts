import type { FsInterface } from "./fs-interface";
import path, { dirname } from "node:path";
import { hasUCDFolderPath } from "@luxass/unicode-utils-new";
import picomatch from "picomatch";

import { createPathFilter, type FilterFn } from "./filter";
import { createDefaultFs } from "./fs-interface";

interface DownloadOptions {
  /**
   * List of Unicode versions to download files for.
   * Each version should be a string representing the Unicode version (e.g., "15.0.0", "14.0.0").
   */
  versions: string[];

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
   * Optional base path where files will be downloaded.
   * Defaults to "./ucd-files" if not provided.
   */
  basePath?: string;

  /**
   * Optional filesystem interface to use for file operations.
   * If not provided, a default implementation using fs-extra will be used.
   */
  fs?: FsInterface;
}

interface DownloadError {
  message: string;
  version?: string;
  file?: string;
}

interface DownloadResult {
  errors: DownloadError[] | null;
  downloadedFiles: string[];
}

interface FileEntry {
  name: string;
  path: string;
  children?: FileEntry[];
}

interface ValidationResult {
  isValid: boolean;
  missingFiles: Array<{
    version: string;
    filePath: string;
    localPath: string;
  }>;
  errors: DownloadError[];
}

interface RepairOptions {
  /**
   * List of Unicode versions to download files for.
   * Each version should be a string representing the Unicode version (e.g., "15.0.0", "14.0.0").
   */
  versions: string[];

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
   * Optional base path where files will be downloaded.
   * Defaults to "./ucd-files" if not provided.
   */
  basePath: string;

  /**
   * Optional filesystem interface to use for file operations.
   * If not provided, a default implementation using fs-extra will be used.
   */
  fs?: FsInterface;
}

interface RepairResult {
  repairedFiles: string[];
  errors: DownloadError[];
}

const CONCURRENCY_LIMIT = 3;

const API_URL = "https://unicode-api.luxass.dev/api/v1";
const UNICODE_PROXY_URL = "https://unicode-proxy.ucdjs.dev";

export async function download(options: DownloadOptions): Promise<DownloadResult> {
  const {
    versions,
    basePath = path.resolve("./ucd-files"),
    fs = createDefaultFs(),
    patternMatcher: providedPatternMatcher,
    patterns = [],
  } = options;

  if (versions.length === 0) {
    return {
      errors: [{ message: "No versions provided. Please provide at least one version." }],
      downloadedFiles: [],
    };
  }

  if (providedPatternMatcher == null && (!patterns || patterns.length === 0)) {
    return {
      errors: [{ message: "No pattern matcher provided. Please provide a pattern matcher or patterns." }],
      downloadedFiles: [],
    };
  }

  const allDownloadedFiles: string[] = [];
  const allErrors: DownloadError[] = [];

  const patternMatcher = providedPatternMatcher || createPathFilter(patterns);

  async function processFileEntries(
    entries: FileEntry[],
    basePath: string,
    versionOutputDir: string,
    downloadedFiles: string[],
    currentDirPath: string = "",
    errors: DownloadError[],
    version: string,
  ): Promise<void> {
    const dirPromises = [];
    const filePromises = [];

    for (const entry of entries) {
      const entryOutputPath = currentDirPath ? path.join(currentDirPath, entry.path) : entry.path;
      const outputPath = path.join(versionOutputDir, entryOutputPath);

      if (entry.children) {
        dirPromises.push((async () => {
          await fs.mkdir(outputPath, { recursive: true });
          await processFileEntries(entry.children || [], `${basePath}/${entry.path}`, versionOutputDir, downloadedFiles, entryOutputPath, errors, version);
        })());
      } else {
        filePromises.push((async () => {
          try {
            await fs.ensureDir(dirname(outputPath));
            const url = `${UNICODE_PROXY_URL}${basePath}/${entry.path}`;
            const response = await fetch(url);

            if (!response.ok) {
              errors.push({
                message: `Failed to fetch ${entry.path}: ${response.status} ${response.statusText}`,
                version,
                file: entry.path,
              });
              return;
            }

            const content = await response.text();
            await fs.writeFile(outputPath, content);
            downloadedFiles.push(outputPath);
          } catch (err) {
            errors.push({
              message: `Error downloading ${entry.path}: ${(err as any).message}`,
              version,
              file: entry.path,
            });
          }
        })());
      }
    }

    await Promise.all([...dirPromises, ...filePromises]);
  }

  async function processVersion(
    version: string,
  ): Promise<{
      downloadedFiles: string[];
      errors: DownloadError[];
    }> {
    const downloadedFiles: string[] = [];
    const errors: DownloadError[] = [];

    const versionOutputDir = path.resolve(basePath, `v${version}`);

    try {
      await fs.mkdir(versionOutputDir, { recursive: true });

      const filesResponse = await fetch(`${API_URL}/unicode-files/${version}`);

      if (!filesResponse.ok) {
        return {
          downloadedFiles,
          errors: [{
            message: `Failed to fetch file list for version ${version}: ${filesResponse.status} ${filesResponse.statusText}`,
            version,
          }],
        };
      }

      const fileEntries = await filesResponse.json();

      if (!Array.isArray(fileEntries)) {
        return {
          downloadedFiles,
          errors: [{
            message: `Invalid response format for version ${version}`,
            version,
          }],
        };
      }

      const filteredEntries = filterEntriesRecursive(fileEntries, patternMatcher);
      const basePath = `/${version}${hasUCDFolderPath(version) ? "/ucd" : ""}`;

      await processFileEntries(filteredEntries, basePath, versionOutputDir, downloadedFiles, "", errors, version);
    } catch (err) {
      errors.push({
        message: `Error processing version ${version}: ${(err as any).message}`,
        version,
      });
    }

    return { downloadedFiles, errors };
  }

  // Process versions in batches
  const versionGroups = [];
  for (let i = 0; i < versions.length; i += CONCURRENCY_LIMIT) {
    versionGroups.push(versions.slice(i, i + CONCURRENCY_LIMIT));
  }

  for (const versionGroup of versionGroups) {
    const batchResults = await Promise.all(versionGroup.map(processVersion));

    for (const result of batchResults) {
      allDownloadedFiles.push(...result.downloadedFiles);
      allErrors.push(...result.errors);
    }
  }

  return {
    errors: allErrors.length > 0 ? allErrors : null,
    downloadedFiles: allDownloadedFiles,
  };
}

export async function validateLocalStore(options: {
  basePath: string;
  versions: string[];
  fs?: FsInterface;
  patternMatcher?: FilterFn;
  patterns?: string[];
}): Promise<ValidationResult> {
  const {
    basePath,
    versions,
    fs = createDefaultFs(),
    patternMatcher: providedPatternMatcher,
    patterns = [],
  } = options;

  const allErrors: DownloadError[] = [];
  const missingFiles: Array<{ version: string; filePath: string; localPath: string }> = [];

  if (providedPatternMatcher == null && (!patterns || patterns.length === 0)) {
    return {
      isValid: false,
      missingFiles: [],
      errors: [{ message: "No pattern matcher provided. Please provide a pattern matcher or patterns." }],
    };
  }

  const patternMatcher = providedPatternMatcher || createPathFilter(patterns);

  function getAllFilePaths(entries: FileEntry[]): string[] {
    const filePaths: string[] = [];
    // eslint-disable-next-line ts/explicit-function-return-type
    function collectPaths(entryList: FileEntry[], currentPath = "") {
      for (const entry of entryList) {
        const fullPath = currentPath ? `${currentPath}/${entry.path}` : entry.path;
        if (!entry.children) {
          filePaths.push(fullPath);
        } else if (entry.children.length > 0) {
          collectPaths(entry.children, fullPath);
        }
      }
    }
    collectPaths(entries);
    return filePaths;
  }

  for (const version of versions) {
    const versionPath = path.join(basePath, `v${version}`);

    try {
      const filesResponse = await fetch(`${API_URL}/unicode-files/${version}`);

      if (!filesResponse.ok) {
        allErrors.push({
          message: `Failed to fetch file list for version ${version}: ${filesResponse.status} ${filesResponse.statusText}`,
          version,
        });
        continue;
      }

      const fileEntries = await filesResponse.json();

      if (!Array.isArray(fileEntries)) {
        allErrors.push({
          message: `Invalid response format for version ${version}`,
          version,
        });
        continue;
      }

      const filteredEntries = filterEntriesRecursive(fileEntries, patternMatcher);

      const localFilePaths = getAllFilePaths(filteredEntries);

      for (const filePath of localFilePaths) {
        const localFileFullPath = path.join(versionPath, filePath);

        try {
          await fs.access(localFileFullPath);
        } catch {
          missingFiles.push({ version, filePath, localPath: localFileFullPath });
        }
      }
    } catch (err) {
      allErrors.push({
        message: `Error validating version ${version}: ${(err as any).message}`,
        version,
      });
    }
  }

  return {
    isValid: allErrors.length === 0 && missingFiles.length === 0,
    missingFiles,
    errors: allErrors,
  };
}

function filterEntriesRecursive(entries: FileEntry[], patternMatcher: FilterFn): FileEntry[] {
  function filterEntries(entryList: FileEntry[], prefix = ""): FileEntry[] {
    const result: FileEntry[] = [];
    for (const entry of entryList) {
      const fullPath = prefix ? `${prefix}/${entry.path}` : entry.path;

      if (!entry.children) {
        if (patternMatcher(fullPath)) {
          result.push(entry);
        }
      } else {
        const filteredChildren = filterEntries(entry.children, fullPath);
        if (filteredChildren.length > 0) {
          result.push({ ...entry, children: filteredChildren });
        }
      }
    }
    return result;
  }

  return filterEntries(entries);
}

export async function repairLocalStore(options: RepairOptions): Promise<RepairResult> {
  const {
    basePath,
    versions,
    fs = createDefaultFs(),
    patternMatcher: providedPatternMatcher,
    patterns = [],
  } = options;

  const repairedFiles: string[] = [];
  const errors: DownloadError[] = [];

  if (providedPatternMatcher == null && (!patterns || patterns.length === 0)) {
    return {
      repairedFiles: [],
      errors: [{ message: "No pattern matcher provided. Please provide a pattern matcher or patterns." }],
    };
  }

  const patternMatcher = providedPatternMatcher || createPathFilter(patterns);

  for (const version of versions) {
    const versionPath = path.join(basePath, `v${version}`);

    try {
      const filesResponse = await fetch(`${API_URL}/unicode-files/${version}`);

      if (!filesResponse.ok) {
        errors.push({
          message: `Failed to fetch file list for version ${version}: ${filesResponse.status} ${filesResponse.statusText}`,
          version,
        });
        continue;
      }

      const fileEntries = await filesResponse.json();

      if (!Array.isArray(fileEntries)) {
        errors.push({
          message: `Invalid response format for version ${version}`,
          version,
        });
        continue;
      }

      const filteredEntries = filterEntriesRecursive(fileEntries, patternMatcher);
      const basePath = `/${version}`;

      for (const entry of filteredEntries) {
        const entryPath = path.join(versionPath, entry.path);

        if (entry.children) {
          await fs.mkdir(entryPath, {
            recursive: true,
          });
        } else {
          const url = `${UNICODE_PROXY_URL}${basePath}/${hasUCDFolderPath(version) ? "ucd/" : ""}${entry.path}`;
          const response = await fetch(url);

          if (!response.ok) {
            errors.push({
              message: `Failed to fetch ${entry.path}: ${response.status} ${response.statusText}`,
              version,
              file: entry.path,
            });
            continue;
          }

          const content = await response.text();
          await fs.writeFile(entryPath, content);
          repairedFiles.push(entryPath);
        }
      }
    } catch (err) {
      errors.push({
        message: `Error repairing version ${version}: ${(err as any).message}`,
        version,
      });
    }
  }

  return {
    repairedFiles,
    errors,
  };
}

/**
 * Downloads a single file for a specific version
 */
export async function downloadSingleFile(
  version: string,
  filePath: string,
  localPath: string,
  fs: FsInterface = createDefaultFs(),
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure the directory exists
    await fs.ensureDir(path.dirname(localPath));

    // Build the URL for the file
    const url = `${UNICODE_PROXY_URL}/${version}/${hasUCDFolderPath(version) ? "ucd/" : ""}${filePath}`;

    // Fetch the file content
    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch ${filePath}: ${response.status} ${response.statusText}`,
      };
    }

    const content = await response.text();

    // Write the file to local storage
    await fs.writeFile(localPath, content, "utf-8");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Error downloading ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Repair a store by validating and downloading missing files
 */
export async function repairStore(
  store: {
    basePath: string;
    versions: string[];
  },
  options: {
    concurrency?: number;
    fs?: FsInterface;
    patternMatcher?: FilterFn;
    patterns?: string[];
  } = {},
): Promise<{
    repairedFiles: string[];
    errors: string[];
    totalMissingFiles: number;
  }> {
  const {
    concurrency = 5,
    fs = createDefaultFs(),
    patternMatcher: providedPatternMatcher,
    patterns = [],
  } = options;

  // Validate the local store to find missing files
  const validationResult = await validateLocalStore({
    basePath: store.basePath,
    versions: store.versions,
    patternMatcher: providedPatternMatcher,
    patterns,
    fs,
  });

  const repairedFiles: string[] = [];
  const errors: string[] = [];

  // If there are missing files, download them
  if (validationResult.missingFiles.length > 0) {
    // Process files in batches to control concurrency
    const batches = [];
    for (let i = 0; i < validationResult.missingFiles.length; i += concurrency) {
      batches.push(validationResult.missingFiles.slice(i, i + concurrency));
    }

    for (const batch of batches) {
      const downloadPromises = batch.map(async (missingFile) => {
        try {
          const result = await downloadSingleFile(
            missingFile.version,
            missingFile.filePath,
            missingFile.localPath,
            fs,
          );

          if (result.success) {
            repairedFiles.push(missingFile.localPath);
            return { success: true, file: missingFile };
          } else {
            errors.push(`Failed to download ${missingFile.filePath} for version ${missingFile.version}: ${result.error}`);
            return { success: false, file: missingFile, error: result.error };
          }
        } catch (error) {
          const errorMessage = `Error downloading ${missingFile.filePath} for version ${missingFile.version}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMessage);
          return { success: false, file: missingFile, error: errorMessage };
        }
      });

      // Wait for the current batch to complete
      await Promise.all(downloadPromises);
    }
  }

  // Add validation errors to the errors array
  validationResult.errors.forEach((error) => {
    errors.push(error.message);
  });

  return {
    repairedFiles,
    errors,
    totalMissingFiles: validationResult.missingFiles.length,
  };
}
