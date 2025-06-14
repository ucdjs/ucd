import type { CLIArguments } from "../../cli-utils";
import { printHelp } from "../../cli-utils";

export interface CLIStoreCleanCmdOptions {
  flags: CLIArguments<{
    storeDir?: string;
    dryRun?: boolean;
    versions?: string[];
  }>;
}

export async function runCleanStore({ flags }: CLIStoreCleanCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Clean an UCD Store",
      commandName: "ucd store clean",
      usage: "[...flags]",
      tables: {
        Flags: [
          ["--versions", "Specific versions to clean (default: all)."],
          ["--store-dir", "Directory where the UCD files are stored."],
          ["--dry-run", "Show what would be deleted without actually deleting."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.log("Cleaning UCD Store...");
}
