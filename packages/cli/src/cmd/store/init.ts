import type { CLIArguments } from "../../cli-utils";
import { printHelp } from "../../cli-utils";

export interface CLIStoreInitCmdOptions {
  flags: CLIArguments<{
    storeDir?: string;
    patterns?: string[];
    force?: boolean;
  }>;
  versions: string[];
}

export async function runInitStore({ flags, versions }: CLIStoreInitCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Initialize an UCD Store",
      commandName: "ucd store init",
      usage: "<versions...> [...flags]",
      tables: {
        Flags: [
          ["--patterns", "Glob patterns to match UCD files."],
          ["--store-dir", "Directory to store the UCD files."],
          ["--force", "Overwrite existing files if they already exist."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  if (!versions || versions.length === 0) {
    console.error("Error: At least one Unicode version must be specified.");
    console.error("Usage: ucd store init <versions...>");
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`Initializing UCD Store with versions: ${versions.join(", ")}...`);
}
