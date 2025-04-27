import type { CLIArguments } from "../../cli-utils";
import { printHelp } from "../../cli-utils";

export interface CLICodegenFieldsCmdOptions {
  flags: CLIArguments<{
    outputFile: string;
    inputDir: string;
  }>;
}

export async function runFieldCodegen({ flags }: CLICodegenFieldsCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Generate Unicode Data Files",
      commandName: "ucd codegen fields",
      usage: "[...flags]",
      tables: {
        Flags: [
          ["--output-file", "Specify the output directory."],
          ["--input-dir", "Specify the input directory."],
          ["--version", "Show the version number and exit."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const _outputMode = flags.outputFile == null ? "stdout" : "file";
}
