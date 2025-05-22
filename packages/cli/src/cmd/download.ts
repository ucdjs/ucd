import type { CLIArguments } from "../cli-utils";
import { mkdir, writeFile } from "node:fs/promises";
import path, { dirname, join } from "node:path";
import { hasUCDPath, mapToUCDPathVersion, UNICODE_TO_UCD_PATH_MAPPINGS, UNICODE_VERSION_METADATA } from "@luxass/unicode-utils";
import { gray, green, yellow } from "farver/fast";
import { printHelp } from "../cli-utils";

export interface CLIDownloadCmdOptions {
  flags: CLIArguments<{
    outputDir?: string;
    filter?: string;
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
          ["--filter", "Filter the files to download."],
          ["--force", "Force the download, even if the files already exist."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  if (providedVersions.length === 0) {
    console.error("No versions provided. Please provide at least one version.");
    return;
  }

  let versions: { version: string; mappedVersion?: string }[] = [];

  if (providedVersions[0] === "all") {
    versions = UNICODE_VERSION_METADATA.map((v) => {
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

  // exit early, if some versions are invalid
  const invalidVersions = versions.filter(({ version }) => !UNICODE_VERSION_METADATA.find((v) => v.version === version));
  if (invalidVersions.length > 0) {
    console.error(
      `Invalid version(s) provided: ${invalidVersions.join(", ")}. Please provide valid Unicode versions.`,
    );
    return;
  }

  // eslint-disable-next-line node/prefer-global/process
  const outputDir = flags.outputDir ?? path.join(process.cwd(), "data");
  await mkdir(outputDir, { recursive: true });

  async function processFileEntries(
    entries: FileEntry[],
    basePath: string,
    versionOutputDir: string,
    downloadedFiles: string[],
  ): Promise<void> {
    const dirPromises: Promise<void>[] = [];
    const filePromises: Promise<void>[] = [];

    for (const entry of entries) {
      const outputPath = path.join(versionOutputDir, entry.path);

      if (entry.children) {
        // create directory and process children
        dirPromises.push((async () => {
          await mkdir(outputPath, { recursive: true });
          await processFileEntries(entry.children!, `${basePath}/${entry.path}`, versionOutputDir, downloadedFiles);
        })());
      } else {
        filePromises.push((async () => {
          try {
            await mkdir(dirname(outputPath), { recursive: true });
            const url = `${UNICODE_PROXY_URL}${basePath}/${entry.path}`;
            const response = await fetch(url);
            if (!response.ok) {
              console.error(`Failed to fetch file: ${entry.path} (${response.status} ${response.statusText})`);
              return;
            }
            const content = await response.text();
            await writeFile(outputPath, content);
            downloadedFiles.push(outputPath);
          } catch (error) {
            console.error(`Error processing file ${entry.path}:`, error);
          }
        })());
      }
    }

    // first wait for all directories to be created (and their children processed)
    await Promise.all(dirPromises);

    // then wait for all file downloads to complete
    await Promise.all(filePromises);
  }

  async function processVersion(version: { version: string; mappedVersion?: string }): Promise<void> {
    // eslint-disable-next-line no-console
    console.info(`Starting download process for Unicode ${green(version.version)}${version.mappedVersion != null ? gray(` (${green(version.mappedVersion)})`) : ""}`);
    const downloadedFilesForVersion: string[] = [];

    const versionOutputDir = path.join(outputDir, `v${version.version}`);
    await mkdir(versionOutputDir, { recursive: true });

    try {
      // fetch the file list from the new API endpoint
      const filesResponse = await fetch(`${API_URL}/unicode-files/${version.version}`);

      if (!filesResponse.ok) {
        console.error(`Failed to fetch file list for version ${version.version}: ${filesResponse.status} ${filesResponse.statusText}`);
        return;
      }

      const fileEntries = await filesResponse.json() as FileEntry[];

      if (!Array.isArray(fileEntries)) {
        console.error(`Invalid response format for version ${version.version}`);
        return;
      }

      // filter out any ReadMe.txt files if needed
      const filteredEntries = fileEntries.filter((entry) =>
        flags.filter ? entry.path.includes(flags.filter) : true,
      );

      // create base path for fetching files
      const correctVersion = version.mappedVersion ?? version.version;
      const basePath = `/${correctVersion}${hasUCDPath(correctVersion) ? "/ucd" : ""}`;

      // process all files and directories
      await processFileEntries(filteredEntries, basePath, versionOutputDir, downloadedFilesForVersion);

      if (downloadedFilesForVersion.length === 0) {
        console.warn(yellow(`No files were downloaded for Unicode ${version.version}.`));
        return;
      }

      // eslint-disable-next-line no-console
      console.info(green(`✓ Downloaded ${downloadedFilesForVersion.length} files for Unicode ${version.version}`));
      for (const file of downloadedFilesForVersion) {
        const relativePath = path.relative(versionOutputDir, file);
        // eslint-disable-next-line no-console
        console.info(green(`  - ${relativePath}`));
      }
    } catch (error) {
      console.error(`Error processing version ${version.version}:`, error);
    }
  }

  const versionGroups = [];

  // group versions into batches of CONCURRENCY_LIMIT
  for (let i = 0; i < versions.length; i += CONCURRENCY_LIMIT) {
    versionGroups.push(versions.slice(i, i + CONCURRENCY_LIMIT));
  }

  // process each batch sequentially, with versions within each batch processed in parallel
  for (const versionGroup of versionGroups) {
    await Promise.all(versionGroup.map((version) => processVersion(version)));
  }
}
