import type { CLIArguments } from "../cli-utils";
import { printHelp } from "../cli-utils";

export interface CLIDownloadCmdOptions {
  flags: CLIArguments<{
    outputDir?: string;
    filter?: string;
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
  }
}
