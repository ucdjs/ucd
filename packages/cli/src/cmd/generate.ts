import type { CLIArguments } from "../cli-utils";
import { mkdir, writeFile } from "node:fs/promises";
import path, { dirname, join } from "node:path";
import { UNICODE_VERSIONS, UNICODE_VERSIONS_WITH_UCD } from "@luxass/unicode-utils";
import { green, yellow } from "farver/fast";
import { printHelp } from "../cli-utils";

export interface CLIGenerateCmdOptions {
  flags: CLIArguments<{
    outputDir: string;
  }>;
  versions: string[];
}

interface Entry {
  type: "directory" | "file";
  name: string;
  path: string;
}

const BASE_URL = "https://unicode-proxy.ucdjs.dev/proxy";

export async function runGenerate({ versions: providedVersions, flags }: CLIGenerateCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Generate Unicode Data Files",
      commandName: "ucd generate",
      usage: "<...versions> [...flags]",
      tables: {
        Flags: [
          ["--output-dir", "Specify the output directory."],
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

  if (providedVersions[0] === "all") {
    providedVersions = UNICODE_VERSIONS_WITH_UCD.map((v) => v.version);
  }

  // exit early, if some versions are invalid
  const invalidVersions = providedVersions.filter((version) => !UNICODE_VERSIONS.find((v) => v.version === version));
  if (invalidVersions.length > 0) {
    console.error(
      `Invalid version(s) provided: ${invalidVersions.join(", ")}. Please provide valid Unicode versions.`,
    );
    return;
  }

  // eslint-disable-next-line node/prefer-global/process
  const outputDir = flags.outputDir ?? path.join(process.cwd(), "data");
  await mkdir(outputDir, { recursive: true });

  async function processDirectory(
    entry: Entry,
    basePath: string,
    version: string,
    baseOutputDir: string,
    downloadedFiles: string[],
  ): Promise<void> {
    const dirPath = `${BASE_URL}/${version}/ucd/${entry.path}`;
    const dirResponse = await fetch(dirPath);

    if (!dirResponse.ok) {
      console.error(`failed to fetch directory: ${entry.path}`);
      return;
    }

    const dirEntries = (await dirResponse.json()) as Entry[];

    if (!Array.isArray(dirEntries)) {
      console.error(`invalid response format for directory: ${entry.path}`);
      return;
    }

    const fileEntries = dirEntries.filter(
      (e) =>
        e.type === "file"
        && e.name !== "ReadMe.txt"
        && !e.path.includes("latest")
        && !e.path.includes("draft"),
    );

    await Promise.all(
      fileEntries.map(async (fileEntry) => {
        const fullPath = `${basePath}/${entry.path}/${fileEntry.path}`;
        const pathParts = fullPath.replace(/^\//, "").split("/");
        const filePath = join(baseOutputDir, pathParts.slice(2).join("/"));

        await mkdir(dirname(filePath), { recursive: true });

        try {
          const content = await fetch(`${BASE_URL}${fullPath}`).then((res) => res.text());
          await writeFile(filePath, content);
          downloadedFiles.push(filePath);
        } catch {
          console.error(`failed to process file: ${fullPath}`);
        }
      }),
    );

    const dirEntriesToProcess = dirEntries.filter((e) => e.type === "directory");
    await Promise.all(
      dirEntriesToProcess.map((dir) =>
        processDirectory(dir, `${basePath}/${entry.path}`, version, baseOutputDir, downloadedFiles),
      ),
    );
  }

  for (const version of providedVersions) {
    // eslint-disable-next-line no-console
    console.info(`Starting the generation process for data files for ${green(`Unicode ${version}`)}!`);
    const downloadedFilesForVersion: string[] = [];

    const versionPath = `/${version}/ucd`;
    const rootResponse = await fetch(`${BASE_URL}${versionPath}`);

    if (!rootResponse.ok) {
      console.error(`failed to fetch data for version ${version}`);
      continue;
    }

    const rootEntries = (await rootResponse.json()) as Entry[];

    if (!Array.isArray(rootEntries)) {
      console.error(`invalid response format for version ${version}`);
      continue;
    }

    const versionOutputDir = path.join(outputDir, `v${version}`);
    await mkdir(versionOutputDir, { recursive: true });

    const rootFiles = rootEntries.filter(
      (e) =>
        e.type === "file"
        && e.name !== "ReadMe.txt"
        && !e.path.includes("latest")
        && !e.path.includes("draft"),
    );

    await Promise.all(
      rootFiles.map(async (fileEntry) => {
        const fileUrl = `${versionPath}/${fileEntry.path}`;
        const outputFilePath = path.join(versionOutputDir, fileEntry.name);

        try {
          const content = await fetch(`${BASE_URL}${fileUrl}`).then((res) => res.text());
          await writeFile(outputFilePath, content);
          downloadedFilesForVersion.push(outputFilePath);
        } catch {
          console.error(`failed to process file: ${fileUrl}`);
        }
      }),
    );

    const directories = rootEntries.filter((e) => e.type === "directory");
    await Promise.all(
      directories.map((dir) =>
        processDirectory(dir, versionPath, version, versionOutputDir, downloadedFilesForVersion),
      ),
    );

    if (downloadedFilesForVersion.length === 0) {
      console.warn(yellow(`No files were downloaded for Unicode ${version}.`));
      continue;
    }

    // eslint-disable-next-line no-console
    console.info(green(`✓ Generated ${downloadedFilesForVersion.length} for Unicode ${version}`));
    for (const file of downloadedFilesForVersion) {
      const relativePath = path.relative(versionOutputDir, file);
      // eslint-disable-next-line no-console
      console.info(green(`  - ${relativePath}`));
    }
  }
}
