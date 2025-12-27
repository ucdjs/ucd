import type { CLIArguments } from "../../cli-utils";
import { printHelp } from "../../cli-utils";

export interface CLIFilesCmdOptions {
  flags: CLIArguments<{
    baseUrl?: string;
    json?: boolean;
    output?: string;
  }>;
}

const FILES_SUBCOMMANDS = [
  "list",
  "get",
  "info",
] as const;
export type Subcommand = (typeof FILES_SUBCOMMANDS)[number];

function isValidSubcommand(subcommand: string): subcommand is Subcommand {
  return FILES_SUBCOMMANDS.includes(subcommand as Subcommand);
}

export async function runFilesRoot(subcommand: string, { flags }: CLIFilesCmdOptions) {
  const isValidSub = isValidSubcommand(subcommand);
  const requestsHelp = flags?.help || flags?.h;

  if (!isValidSub || (requestsHelp && !isValidSub)) {
    printHelp({
      commandName: "ucd files",
      usage: "[command] [...flags]",
      tables: {
        Commands: [
          ["list", "List files and directories from the UCD API."],
          ["get", "Get a specific file from the UCD API."],
          ["info", "Get metadata about a file or directory."],
        ],
        Flags: [
          ["--base-url", "Base URL for the UCD API (defaults to api.ucdjs.dev)."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  if (subcommand === "list") {
    const { runFilesList } = await import("./list");
    const pathParts = flags._.slice(2) as string[];
    // Join path parts in case path was split (e.g., if it contains spaces)
    const path = pathParts.length > 0 ? pathParts.join(" ") : "";
    await runFilesList({
      path,
      flags: flags as CLIFilesCmdOptions["flags"],
    });
    return;
  }

  if (subcommand === "get") {
    const { runFilesGet } = await import("./get");
    const pathParts = flags._.slice(2) as string[];
    // Join path parts in case path was split (e.g., if it contains spaces)
    const path = pathParts.length > 0 ? pathParts.join(" ") : "";
    await runFilesGet({
      path,
      flags: flags as CLIFilesCmdOptions["flags"],
    });
    return;
  }

  if (subcommand === "info") {
    const { runFilesInfo } = await import("./info");
    const pathParts = flags._.slice(2) as string[];
    // Join path parts in case path was split (e.g., if it contains spaces)
    const path = pathParts.length > 0 ? pathParts.join(" ") : "";
    await runFilesInfo({
      path,
      flags: flags as CLIFilesCmdOptions["flags"],
    });
    return;
  }

  throw new Error(`Invalid subcommand: ${subcommand}`);
}
