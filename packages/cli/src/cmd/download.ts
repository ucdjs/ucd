/* eslint-disable no-console */
import type { CLIArguments } from "../cli-utils";
import { mkdir, writeFile } from "node:fs/promises";
import path, { dirname } from "node:path";
import { hasUCDPath, mapToUCDPathVersion, UNICODE_VERSION_METADATA } from "@luxass/unicode-utils";
import { gray, green, red, yellow } from "farver/fast";
import micromatch from "micromatch";
import { printHelp } from "../cli-utils";

export interface CLIDownloadCmdOptions {
  flags: CLIArguments<{
    outputDir?: string;
    exclude?: string;
    excludeTest?: boolean;
    excludeDraft?: boolean;
    createCommentFiles?: boolean;
    debug?: boolean;
    force?: boolean;
  }>;
  versions: string[];
}

interface FileEntry {
  name: string;
  path: string;
  children?: FileEntry[];
}

const CONCURRENCY_LIMIT = 3;
const API_URL = "https://unicode-api.luxass.dev/api/v1";
const UNICODE_PROXY_URL = "https://unicode-proxy.ucdjs.dev";

export async function runDownload({ versions: providedVersions, flags }: CLIDownloadCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Download Unicode Data Files",
      commandName: "ucd download",
      usage: "<...versions> [...flags]",
      tables: {
        Flags: [
          ["--output-dir", "Specify the output directory."],
          ["--exclude", "Exclude files matching glob patterns (e.g., '*Test*,ReadMe.txt,*.draft')."],
          ["--exclude-test", "Exclude all test files (ending with Test.txt)."],
          ["--exclude-draft", "Exclude all draft files"],
          ["--create-comment-files", "Create comment files for each downloaded file."],
          ["--force", "Force the download, even if the files already exist."],
          ["--debug", "Enable debug output."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  if (providedVersions.length === 0) {
    console.error(red("No versions provided. Please provide at least one version."));
    return;
  }

  // parse and validate versions
  let versions = [];
  if (providedVersions[0] === "all") {
    versions = UNICODE_VERSION_METADATA.filter((v) => !flags.excludeDraft || v.status !== "draft").map((v) => {
      const mappedVersion = mapToUCDPathVersion(v.version);
      return {
        version: v.version,
        mappedVersion: mappedVersion === v.version ? undefined : mappedVersion,
      };
    });
  } else {
    versions = providedVersions.map((v) => {
      const mappedVersion = mapToUCDPathVersion(v);
      return {
        version: v,
        mappedVersion: mappedVersion === v ? undefined : mappedVersion,
      };
    });
  }

  const invalidVersions = versions.filter(({ version }) =>
    !UNICODE_VERSION_METADATA.find((v) => v.version === version),
  );

  if (invalidVersions.length > 0) {
    console.error(red(
      `Invalid version(s): ${invalidVersions.map((v) => v.version).join(", ")}. Please provide valid Unicode versions.`,
    ));
    return;
  }

  // eslint-disable-next-line node/prefer-global/process
  const outputDir = flags.outputDir ?? path.join(process.cwd(), "data");
  await mkdir(outputDir, { recursive: true });

  // Build exclude patterns
  const excludePatterns = flags.exclude?.split(",").map((p) => p.trim()).filter(Boolean) || [];
  if (flags.excludeTest) {
    excludePatterns.push("**/*Test*");
  }

  function getAllFilePaths(entries: FileEntry[]) {
    const filePaths: string[] = [];
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

  function filterEntriesRecursive(entries: FileEntry[]) {
    if (excludePatterns.length === 0) return entries;

    const allPaths = getAllFilePaths(entries);
    const patterns = ["**", ...excludePatterns.map((pattern) => `!${pattern}`)];

    const matchedPaths = new Set(micromatch(allPaths, patterns, {
      dot: true,
      nocase: true,
      debug: flags.debug,
    }));

    function filterEntries(entryList: FileEntry[], prefix = "") {
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
    errors: string[],
  ) {
    const dirPromises = [];
    const filePromises = [];

    for (const entry of entries) {
      const entryOutputPath = currentDirPath ? path.join(currentDirPath, entry.path) : entry.path;
      const outputPath = path.join(versionOutputDir, entryOutputPath);

      if (entry.children) {
        dirPromises.push((async () => {
          await mkdir(outputPath, { recursive: true });
          await processFileEntries(entry.children || [], `${basePath}/${entry.path}`, versionOutputDir, downloadedFiles, entryOutputPath, errors);
        })());
      } else {
        filePromises.push((async () => {
          try {
            await mkdir(dirname(outputPath), { recursive: true });
            const url = `${UNICODE_PROXY_URL}${basePath}/${entry.path}`;
            const response = await fetch(url);

            if (!response.ok) {
              errors.push(`Failed to fetch ${entry.path}: ${response.status} ${response.statusText}`);
              return;
            }

            const content = await response.text();
            if (flags.createCommentFiles) {
              await writeFile(`${outputPath.replace(".txt", "")}.comment.txt`, "");
            }

            await writeFile(outputPath, content);
            downloadedFiles.push(outputPath);
          } catch (err) {
            errors.push(`Error downloading ${entry.path}: ${(err as any).message}`);
          }
        })());
      }
    }

    await Promise.all([...dirPromises, ...filePromises]);
  }

  async function processVersion(version: { version: string; mappedVersion?: string }) {
    console.info(`Starting download for Unicode ${green(version.version)}${
      version.mappedVersion ? gray(` (${green(version.mappedVersion)})`) : ""
    }`);

    const downloadedFiles: string[] = [];
    const errors: string[] = [];
    const versionOutputDir = path.join(outputDir, `v${version.version}`);
    await mkdir(versionOutputDir, { recursive: true });

    try {
      const filesResponse = await fetch(`${API_URL}/unicode-files/${version.version}`);

      if (!filesResponse.ok) {
        console.error(red(`Failed to fetch file list for version ${version.version}: ${filesResponse.status} ${filesResponse.statusText}`));
        return { version: version.version, downloadedFiles, errors: [`Failed to fetch file list: ${filesResponse.statusText}`] };
      }

      const fileEntries = await filesResponse.json();

      if (!Array.isArray(fileEntries)) {
        console.error(red(`Invalid response format for version ${version.version}`));
        return { version: version.version, downloadedFiles, errors: ["Invalid response format"] };
      }

      const filteredEntries = filterEntriesRecursive(fileEntries);
      const correctVersion = version.mappedVersion ?? version.version;
      const basePath = `/${correctVersion}${hasUCDPath(correctVersion) ? "/ucd" : ""}`;

      await processFileEntries(filteredEntries, basePath, versionOutputDir, downloadedFiles, "", errors);

      if (downloadedFiles.length === 0 && errors.length === 0) {
        console.warn(yellow(`No files were downloaded for Unicode ${version.version}`));
      } else if (downloadedFiles.length > 0) {
        console.info(green(`✓ Downloaded ${downloadedFiles.length} files for Unicode ${version.version}`));

        if (flags.debug) {
          downloadedFiles.forEach((file) => {
            const relativePath = path.relative(versionOutputDir, file);
            console.info(green(`  - ${relativePath}`));
          });
        }
      }

      if (errors.length > 0) {
        console.warn(yellow(`${errors.length} errors occurred during download of Unicode ${version.version}`));
        if (flags.debug) {
          errors.forEach((error) => console.error(red(`  - ${error}`)));
        }
      }
    } catch (err) {
      const errorMessage = `Error processing version ${version.version}: ${(err as any).message}`;
      errors.push(errorMessage);
      console.error(red(errorMessage));
    }

    return { version: version.version, downloadedFiles, errors };
  }

  // process versions in batches
  const results = [];
  const versionGroups = [];

  for (let i = 0; i < versions.length; i += CONCURRENCY_LIMIT) {
    versionGroups.push(versions.slice(i, i + CONCURRENCY_LIMIT));
  }

  for (const versionGroup of versionGroups) {
    const batchResults = await Promise.all(versionGroup.map(processVersion));
    results.push(...batchResults);
  }

  // print summary
  const totalFiles = results.reduce((sum, r) => sum + r.downloadedFiles.length, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const successfulVersions = results.filter((r) => r.downloadedFiles.length > 0).length;

  console.info(`\n${"=".repeat(50)}`);
  console.info("Download Summary:");
  console.info(green(`✓ ${successfulVersions}/${results.length} versions processed successfully`));
  console.info(green(`✓ ${totalFiles} total files downloaded`));

  if (totalErrors > 0) {
    console.warn(yellow(`⚠ ${totalErrors} total errors encountered`));
  }

  console.info("=".repeat(50));
}
