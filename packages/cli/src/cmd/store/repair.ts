import type { CLIArguments } from "../../cli-utils";
import { printHelp } from "../../cli-utils";

export interface CLIStoreRepairCmdOptions {
  flags: CLIArguments<{
    storeDir?: string;
    patterns?: string[];
    missingOnly?: boolean;
  }>;
  versions?: string[];
}

export async function runRepairStore({ flags }: CLIStoreRepairCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Repair an UCD Store",
      commandName: "ucd store repair",
      usage: "[versions...] [...flags]",
      tables: {
        Flags: [
          ["--patterns", "Glob patterns to match UCD files."],
          ["--store-dir", "Directory where the UCD files are stored."],
          ["--missing-only", "Only download missing files, don't re-download existing ones."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.log("Repairing UCD Store...");
}
