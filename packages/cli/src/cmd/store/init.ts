import type { CLIArguments } from "../../cli-utils";
import { printHelp } from "../../cli-utils";

export interface CLIStoreInitCmdOptions {
  flags: CLIArguments<{
    storeDir?: string;
    patterns?: string[];
  }>;
  versions: string;
}

export async function runInitStore({ flags }: CLIStoreInitCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Initialize an UCD Store",
      commandName: "ucd store init",
      usage: "<versions...> [...flags]",
      tables: {
        Flags: [
          ["--patterns", "Glob patterns to match UCD files."],
          ["--store-dir", "Directory to store the UCD files."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.log("Initializing UCD Store...");
}
