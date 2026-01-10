import type { CLIArguments } from "../../cli-utils";
import { printHelp } from "../../cli-utils";

export interface CLILockfileCmdOptions {
  flags: CLIArguments<{
    storeDir?: string;
    json?: boolean;
  }>;
}

const LOCKFILE_SUBCOMMANDS = [
  "info",
  "hash",
  "validate",
] as const;
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
        Commands: [
          ["info", "Display lockfile information and summary."],
          ["validate", "Validate lockfile against the expected schema."],
          ["hash", "Compute content hash for a file (useful for debugging)."],
        ],
        Flags: [
          ["--store-dir", "Directory where the UCD store is located."],
          ["--json", "Output in JSON format."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  if (subcommand === "info") {
    const { runLockfileInfo } = await import("./info");
    await runLockfileInfo({ flags });
    return;
  }

  if (subcommand === "hash") {
    const { runLockfileHash } = await import("./hash");
    const pathParts = flags._.slice(2) as string[];
    const filePath = pathParts.length > 0 ? pathParts.join(" ") : "";
    await runLockfileHash({ filePath, flags });
    return;
  }

  if (subcommand === "validate") {
    const { runLockfileValidate } = await import("./validate");
    await runLockfileValidate({ flags });
    return;
  }

  throw new Error(`Invalid subcommand: ${subcommand}`);
}
