import type { CLIArguments } from "../cli-utils";
import path from "node:path";
import { green } from "farver/fast";
import { printHelp } from "../cli-utils";

export interface CLIGenerateCmdOptions {
  flags: CLIArguments<{
    force: boolean;
    outputDir: string;
  }>;
  versions: string[];
}

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

  // eslint-disable-next-line node/prefer-global/process
  const _outputDir = flags.outputDir ?? path.join(process.cwd(), "data");

  // eslint-disable-next-line no-console
  console.log(green(`Generating emoji data for versions: ${providedVersions.join(", ")}`));
}
