import type { CLIArguments } from "../../cli-utils";
import { printHelp } from "../../cli-utils";

export interface CLILockfileCmdOptions {
  flags: CLIArguments<{
    storeDir?: string;
    json?: boolean;
  }>;
}

const LOCKFILE_SUBCOMMANDS = [] as const;
export type Subcommand = (typeof LOCKFILE_SUBCOMMANDS)[number];

function isValidSubcommand(subcommand: string): subcommand is Subcommand {
  return LOCKFILE_SUBCOMMANDS.includes(subcommand as Subcommand);
}

export async function runLockfileRoot(subcommand: string, { flags }: CLILockfileCmdOptions) {
  const isValidSub = isValidSubcommand(subcommand);
  const requestsHelp = flags?.help || flags?.h;

  if (!isValidSub || (requestsHelp && !isValidSub)) {
    printHelp({
      commandName: "ucd lockfile",
      usage: "[command] [...flags]",
      tables: {
        Commands: [],
        Flags: [
          ["--store-dir", "Directory where the UCD store is located."],
          ["--json", "Output in JSON format."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  throw new Error(`Invalid subcommand: ${subcommand}`);
}
