import type { CLIArguments } from "../../cli-utils";
import { printHelp } from "../../cli-utils";

export interface CLIStoreValidateCmdOptions {
  flags: CLIArguments<{
    storeDir?: string;
    patterns?: string[];
    fix?: boolean;
  }>;
  versions?: string[];
}

export async function runValidateStore({ flags }: CLIStoreValidateCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Validate an UCD Store",
      commandName: "ucd store validate",
      usage: "[versions...] [...flags]",
      tables: {
        Flags: [
          ["--patterns", "Glob patterns to match UCD files."],
          ["--store-dir", "Directory where the UCD files are stored."],
          ["--fix", "Automatically fix validation issues by downloading missing files."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.log("Validating UCD Store...");
}
