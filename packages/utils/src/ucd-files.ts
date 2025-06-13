import type { FSAdapter } from "./types";
import path, { dirname } from "node:path";
import { hasUCDFolderPath } from "@luxass/unicode-utils-new";
import { createClient, type UnicodeVersionFile } from "@luxass/unicode-utils-new/fetch";
import defu from "defu";
import { createPathFilter, type FilterFn } from "./filter";

const UNICODE_PROXY_URL = "https://unicode-proxy.ucdjs.dev";

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

interface DownloadError {
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
  } = defu(options, {
    basePath: "./ucd-files",
    fs: await createDefaultFSAdapter(),
    patternMatcher: undefined,
    patterns: [],
    apiUrl: "https://unicode-api.luxass.dev",
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

type internal__MirrorUnicodeVersionOptions = Required<Omit<MirrorOptions, "versions" | "patterns">> & {
  client: ReturnType<typeof createClient>;
};

async function internal_mirrorUnicodeVersion(version: string, mirrorOptions: internal__MirrorUnicodeVersionOptions): Promise<{
  locatedFiles: string[];
  files: string[];
  errors: DownloadError[];
}> {
  const { basePath, fs, patternMatcher, client } = mirrorOptions;
  const versionOutputDir = path.resolve(basePath, `v${version}`);

  const locatedFiles: string[] = [];
  // downloaded files
  const files: string[] = [];
  const errors: DownloadError[] = [];
  try {
    await fs.mkdir(versionOutputDir, { recursive: true });

    const { data, error, response } = await client.GET("/api/v1/unicode-files/{version}", {
      params: {
        path: {
          version,
        },
      },
    });

    if (error != null || !response.ok) {
      return {
        locatedFiles,
        files,
        errors: [{
          message: `Failed to fetch file list for version ${version}: ${response.status} ${response.statusText}`,
          version,
        }],
      };
    }

    if (!Array.isArray(data)) {
      return {
        locatedFiles,
        files,
        errors: [{
          message: `Invalid response format for version ${version}`,
          version,
        }],
      };
    }

    const filteredEntries = internal__filterEntriesRecursive(data, patternMatcher);
    const urlPath = `/${version}${hasUCDFolderPath(version) ? "/ucd" : ""}`;
    locatedFiles.push(...internal__flattenFilePaths(filteredEntries, `${version}`));

    await internal__processEntries({
      entries: filteredEntries,
      basePath: urlPath,
      versionOutputDir,
      version,
      currentDirPath: "",
      fs,
      // pass the errors array to collect errors during processing
      errors,
      // for tracking downloaded files
      files,
    });
  } catch (err) {
    errors.push({
      message: `Error processing version ${version}: ${(err as any).message}`,
      version,
    });
  }

  return {
    locatedFiles,
    files,
    errors,
  };
}

interface InternalProcessEntriesOptions {
  version: string;
  basePath: string;
  versionOutputDir: string;
  currentDirPath?: string;
  fs: FSAdapter;
  entries: UnicodeVersionFile[];
  errors: DownloadError[];
  files: string[];
}

async function internal__processEntries(
  options: InternalProcessEntriesOptions,
): Promise<void> {
  const {
    entries,
    basePath,
    versionOutputDir,
    version,
    currentDirPath = "",
    fs,
    errors,
    files,
  } = options;

  const dirPromises = [];
  const filePromises = [];

  for (const entry of entries) {
    const entryOutputPath = currentDirPath ? path.join(currentDirPath, entry.path) : entry.path;
    const outputPath = path.join(versionOutputDir, entryOutputPath);

    if (entry.children) {
      dirPromises.push((async () => {
        await fs.mkdir(outputPath, { recursive: true });
        await internal__processEntries({
          entries: entry.children || [],
          basePath: `${basePath}/${entry.path}`,
          versionOutputDir,
          version,
          currentDirPath: entryOutputPath,
          fs,
          errors,
          files,
        });
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
          files.push(outputPath);
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

function internal__flattenFilePaths(entries: UnicodeVersionFile[], prefix = ""): string[] {
  const paths: string[] = [];

  for (const file of entries) {
    const fullPath = prefix ? `${prefix}/${file.name}` : file.name;

    if (file.children) {
      paths.push(...internal__flattenFilePaths(file.children, fullPath));
    } else {
      paths.push(fullPath);
    }
  }

  return paths;
}

function internal__filterEntriesRecursive(entries: UnicodeVersionFile[], patternMatcher: FilterFn): UnicodeVersionFile[] {
  function filterEntries(entryList: UnicodeVersionFile[], prefix = ""): UnicodeVersionFile[] {
    const result: UnicodeVersionFile[] = [];
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

/**
 * Creates a default file system adapter implementation using Node.js fs/promises module.
 *
 * This adapter provides basic file system operations needed for UCD file handling.
 * Currently, it only implements the readFile method, but could be extended with
 * additional functionality as needed.
 *
 * @returns {Promise<FSAdapter>} A Promise that resolves to a {@link FSAdapter} implementation
 * @throws Error if the Node.js fs module cannot be loaded
 */
export async function createDefaultFSAdapter(): Promise<FSAdapter> {
  try {
    const fsModule = await import("node:fs/promises");

    return {
      async readFile(path) {
        return fsModule.readFile(path, "utf-8");
      },
      async mkdir(dirPath, options) {
        return fsModule.mkdir(dirPath, options);
      },
      async ensureDir(dirPath) {
        try {
          await fsModule.mkdir(dirPath, { recursive: true });
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code !== "EEXIST") {
            throw err;
          }
        }
      },
      async writeFile(filePath, data) {
        await fsModule.writeFile(filePath, data, "utf-8");
      },
    };
  } catch (err) {
    throw new Error("Failed to load file system module", {
      cause: err,
    });
  }
}
