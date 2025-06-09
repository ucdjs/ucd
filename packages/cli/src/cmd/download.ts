/* eslint-disable no-console */
import type { CLIArguments } from "../cli-utils";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { mapToUCDPathVersion, UNICODE_VERSION_METADATA } from "@luxass/unicode-utils";
import { download, PRECONFIGURED_FILTERS } from "@ucdjs/ucd-store";
import { green, red, yellow } from "farver/fast";
import { printHelp } from "../cli-utils";

export interface CLIDownloadCmdOptions {
  flags: CLIArguments<{
    outputDir?: string;
    patterns?: string[];
    excludeTest?: boolean;
    excludeDraft?: boolean;
    excludeHTMLFiles?: boolean;
    excludeReadmes?: boolean;
    force?: boolean;
  }>;
  versions: string[];
}

export async function runDownload({ versions: providedVersions, flags }: CLIDownloadCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Download Unicode Data Files",
      commandName: "ucd download",
      usage: "<...versions> [...flags]",
      tables: {
        Flags: [
          ["--output-dir", "Specify the output directory."],
          ["--patterns", "Patterns to filter files. Can be used multiple times."],
          ["--exclude-test", "Exclude all test files (ending with Test.txt)."],
          ["--exclude-draft", "Exclude all draft files"],
          ["--exclude-html-files", "Exclude HTML files."],
          ["--exclude-readmes", "Exclude README files."],
          ["--force (-f)", "Force the download, even if the files already exist."],
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

  if (flags.excludeDraft) {
    versions = versions.filter(({ version }) => {
      const metadata = UNICODE_VERSION_METADATA.find((v) => v.version === version);
      return metadata && metadata.status !== "draft";
    });
  }

  // eslint-disable-next-line node/prefer-global/process
  const outputDir = flags.outputDir ?? path.join(process.cwd(), "data");
  await mkdir(outputDir, { recursive: true });

  const patterns = [];
  if (flags.excludeHTMLFiles) {
    patterns.push(PRECONFIGURED_FILTERS.EXCLUDE_HTML_FILES);
  }

  if (flags.excludeReadmes) {
    patterns.push(PRECONFIGURED_FILTERS.EXCLUDE_README_FILES);
  }

  if (flags.excludeTest) {
    patterns.push(PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES);
  }

  if (flags.patterns && flags.patterns.length > 0) {
    const customFilters = flags.patterns.map((f) => f.trim()).filter(Boolean);
    patterns.push(...customFilters);
  }

  const result = await download({
    versions: versions.map(({ version }) => version),
    basePath: outputDir,
    patterns,
  });

  // print summary
  const totalFiles = result.downloadedFiles.length;
  const totalErrors = result.errors?.length ?? 0;

  console.info(`\n${"=".repeat(50)}`);
  console.info("Download Summary:");
  console.info(green(`✓ ${totalFiles} total files downloaded`));

  if (totalErrors > 0) {
    console.warn(yellow(`⚠ ${totalErrors} total errors encountered`));
    console.warn("Errors:");
    result.errors?.forEach((error) => {
      console.warn(red(`- ${error.file}: ${error.message} (${error.version})`));
    });
  }

  console.info("=".repeat(50));
}
