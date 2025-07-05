import type { createClient, UnicodeVersionFile } from "@ucdjs/fetch";
import type { PathFilter } from "@ucdjs/utils";
import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import type { DownloadError, MirrorOptions } from "../mirror";
import path, { dirname } from "node:path";
import { hasUCDFolderPath } from "@luxass/unicode-utils-new";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { flattenFilePaths } from "../helpers";

type internal__MirrorUnicodeVersionOptions = Required<Omit<MirrorOptions, "versions" | "patterns">> & {
  client: ReturnType<typeof createClient>;
};

export async function internal_mirrorUnicodeVersion(version: string, mirrorOptions: internal__MirrorUnicodeVersionOptions): Promise<{
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
    await fs.mkdir(versionOutputDir);

    const { data, error, response } = await client.GET("/api/v1/files/{version}", {
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
    locatedFiles.push(...flattenFilePaths(filteredEntries, `${version}`));

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
  fs: FileSystemBridge;
  entries: UnicodeVersionFile[];
  errors: DownloadError[];
  files: string[];
  apiUrl?: string;
}

export async function internal__processEntries(
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
    apiUrl = UCDJS_API_BASE_URL,
  } = options;

  const dirPromises = [];
  const filePromises = [];

  for (const entry of entries) {
    const entryOutputPath = currentDirPath ? path.join(currentDirPath, entry.path) : entry.path;
    const outputPath = path.join(versionOutputDir, entryOutputPath);

    if (entry.children) {
      dirPromises.push((async () => {
        await fs.mkdir(outputPath);
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
          if (!await fs.exists(dirname(outputPath))) {
            await fs.mkdir(dirname(outputPath));
          }
          const url = `${apiUrl}/api/v1/unicode-proxy${basePath}/${entry.path}`;
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
          await fs.write(outputPath, content);
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

export function internal__filterEntriesRecursive(entries: UnicodeVersionFile[], patternMatcher: PathFilter): UnicodeVersionFile[] {
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
