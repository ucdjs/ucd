import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreInitCmdOptions } from "./init";
import { printHelp } from "../../cli-utils";

export interface CLIStoreCmdOptions {
  flags: CLIArguments<{
    outputDir: string;
    outputFile: string;
    inputDir: string;
  }>;
}

const STORE_SUBCOMMANDS = [
  "init",
  "sync",
  "mirror",
  "verify",
  "analyze",
  "status",
] as const;
export type Subcommand = (typeof STORE_SUBCOMMANDS)[number];

function isValidSubcommand(subcommand: string): subcommand is Subcommand {
  return STORE_SUBCOMMANDS.includes(subcommand as Subcommand);
}

export async function runStoreRoot(subcommand: string, { flags }: CLIStoreCmdOptions) {
  const isValidSub = isValidSubcommand(subcommand);
  const requestsHelp = flags?.help || flags?.h;

  if (!isValidSub || (requestsHelp && !isValidSub)) {
    printHelp({
      commandName: "ucd store",
      usage: "[command] [...flags]",
      tables: {
        "Commands (local store only)": [
          ["init", "Initialize an UCD Store (create lockfile and download files)."],
          ["sync", "Sync files to match lockfile state (download missing, optionally remove orphaned)."],
          ["mirror", "Download Unicode data files to local storage."],
        ],
        "Commands (local or remote)": [
          ["verify", "Verify store integrity against API."],
          ["analyze", "Analyze store contents and file status."],
          ["status", "Show store status and version information."],
        ],
        "Flags": [
          ["--force", "Force operation (command-specific behavior)."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const versions = flags._.slice(2) as string[];

  if (subcommand === "init") {
    const { runInitStore } = await import("./init");
    await runInitStore({
      versions,
      flags: flags as CLIStoreInitCmdOptions["flags"],
    });
    return;
  }

  if (subcommand === "sync") {
    const { runSyncStore } = await import("./sync");
    await runSyncStore({ flags, versions });
    return;
  }

  if (subcommand === "mirror") {
    const { runMirrorStore } = await import("./mirror");
    await runMirrorStore({ flags, versions });
    return;
  }

  if (subcommand === "verify") {
    const { runVerifyStore } = await import("./verify");
    await runVerifyStore({ flags, versions });
    return;
  }

  if (subcommand === "analyze") {
    const { runAnalyzeStore } = await import("./analyze");
    await runAnalyzeStore({ flags, versions });
    return;
  }

  if (subcommand === "status") {
    const { runStatusStore } = await import("./status");
    await runStatusStore({ flags });
    return;
  }

  throw new Error(`Invalid subcommand: ${subcommand}`);
}
