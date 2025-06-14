import type { CLIArguments } from "../../cli-utils";
import { printHelp } from "../../cli-utils";

export interface CLIStoreStatusCmdOptions {
  flags: CLIArguments<{
    storeDir?: string;
    verbose?: boolean;
    json?: boolean;
  }>;
}

export async function runStatusStore({ flags }: CLIStoreStatusCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Show UCD Store Status",
      commandName: "ucd store status",
      usage: "[...flags]",
      tables: {
        Flags: [
          ["--store-dir", "Directory where the UCD files are stored."],
          ["--verbose", "Show detailed information about each version."],
          ["--json", "Output status information in JSON format."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.log("Checking UCD Store Status...");
}
