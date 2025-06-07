import { mkdir, writeFile } from "node:fs/promises";
import path, { dirname } from "node:path";
import { hasUCDFolderPath } from "@luxass/unicode-utils-new";
import fsx from "fs-extra";
import micromatch from "micromatch";

interface DownloadOptions {
  versions: string[];
  exclude?: string;
  includeTests?: boolean;
  includeReadmes?: boolean;
  includeHTMLFiles?: boolean;
  basePath?: string;
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
  basePath: string;
  versions: string[];
  excludePatterns?: string[];
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
    exclude,
    includeTests = false,
    includeReadmes = false,
    includeHTMLFiles = false,
    basePath = path.resolve("./ucd-files"),
  } = options;

  if (versions.length === 0) {
    return {
      errors: [{ message: "No versions provided. Please provide at least one version." }],
      downloadedFiles: [],
    };
  }

  const allDownloadedFiles: string[] = [];
  const allErrors: DownloadError[] = [];

  // Build exclude patterns
  const excludePatterns = exclude?.split(",").map((p) => p.trim()).filter(Boolean) || [];

  if (!includeTests) {
    excludePatterns.push("**/*Test*");
  }

  if (!includeReadmes) {
    excludePatterns.push("**/ReadMe*", "**/README*", "**/readme*");
  }

  if (!includeHTMLFiles) {
    excludePatterns.push("**/*.html", "**/*.htm");
  }

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

  function filterEntriesRecursive(entries: FileEntry[]): FileEntry[] {
    if (excludePatterns.length === 0) return entries;

    const allPaths = getAllFilePaths(entries);
    const patterns = ["**", ...excludePatterns.map((pattern) => `!${pattern}`)];

    const matchedPaths = new Set(micromatch(allPaths, patterns, {
      dot: true,
      nocase: true,
    }));

    function filterEntries(entryList: FileEntry[], prefix = ""): FileEntry[] {
      const result: FileEntry[] = [];
      for (const entry of entryList) {
        const fullPath = prefix ? `${prefix}/${entry.path}` : entry.path;

        if (!entry.children) {
          if (matchedPaths.has(fullPath)) {
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
          await mkdir(outputPath, { recursive: true });
          await processFileEntries(entry.children || [], `${basePath}/${entry.path}`, versionOutputDir, downloadedFiles, entryOutputPath, errors, version);
        })());
      } else {
        filePromises.push((async () => {
          try {
            await mkdir(dirname(outputPath), { recursive: true });
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
            await writeFile(outputPath, content);
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
      await mkdir(versionOutputDir, { recursive: true });

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

      const filteredEntries = filterEntriesRecursive(fileEntries);
      const basePath = `/${version}`;

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
  exclude?: string;
}): Promise<ValidationResult> {
  const { basePath, versions, exclude } = options;

  const allErrors: DownloadError[] = [];
  const missingFiles: Array<{ version: string; filePath: string; localPath: string }> = [];

  // Build exclude patterns
  const excludePatterns = exclude?.split(",").map((p) => p.trim()).filter(Boolean) || [];

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

  function filterEntriesRecursive(entries: FileEntry[]): FileEntry[] {
    if (excludePatterns.length === 0) return entries;

    const allPaths = getAllFilePaths(entries);
    const patterns = ["**", ...excludePatterns.map((pattern) => `!${pattern}`)];

    const matchedPaths = new Set(micromatch(allPaths, patterns, {
      dot: true,
      nocase: true,
    }));

    function filterEntries(entryList: FileEntry[], prefix = ""): FileEntry[] {
      const result: FileEntry[] = [];
      for (const entry of entryList) {
        const fullPath = prefix ? `${prefix}/${entry.path}` : entry.path;

        if (!entry.children) {
          if (matchedPaths.has(fullPath)) {
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

      const filteredEntries = filterEntriesRecursive(fileEntries);

      const localFilePaths = getAllFilePaths(filteredEntries);

      for (const filePath of localFilePaths) {
        const localFileFullPath = path.join(versionPath, filePath);

        try {
          await fsx.access(localFileFullPath);
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

export async function repairLocalStore(options: RepairOptions): Promise<RepairResult> {
  const { basePath, versions, excludePatterns } = options;

  const repairedFiles: string[] = [];
  const errors: DownloadError[] = [];

  // Build exclude patterns
  const excludePatternsFull = excludePatterns?.map((pattern) => `!${pattern}`) || [];

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

      const filteredEntries = filterEntriesRecursive(fileEntries);
      const basePath = `/${version}`;

      for (const entry of filteredEntries) {
        const entryPath = path.join(versionPath, entry.path);

        if (entry.children) {
          await fsx.mkdirp(entryPath);
        } else {
          const url = `${UNICODE_PROXY_URL}${basePath}/${entry.path}`;
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
          await writeFile(entryPath, content);
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
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure the directory exists
    await fsx.ensureDir(path.dirname(localPath));

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
    await fsx.writeFile(localPath, content, "utf-8");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Error downloading ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
