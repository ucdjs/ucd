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

const CODEGEN_SUBCOMMANDS = [
  "init",
  "repair",
  "clean",
  "status",
] as const;
export type Subcommand = (typeof CODEGEN_SUBCOMMANDS)[number];

function isValidSubcommand(subcommand: string): subcommand is Subcommand {
  return CODEGEN_SUBCOMMANDS.includes(subcommand as Subcommand);
}

export async function runStoreRoot(subcommand: string, { flags }: CLIStoreCmdOptions) {
  if (!isValidSubcommand(subcommand) || (!isValidSubcommand(subcommand) && (flags?.help || flags?.h))) {
    printHelp({
      commandName: "ucd store",
      usage: "[command] [...flags]",
      tables: {
        Commands: [
          ["init", "Initialize an UCD Store."],
          ["repair", "Repair an UCD Store."],
          ["clean", "Clean an UCD Store."],
          ["status", "Show the status of an UCD Store."],
        ],
        Flags: [
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  if (subcommand === "init") {
    const { runInitStore } = await import("./init");
    const versions = flags._.slice(4) as string[];

    await runInitStore({
      versions,
      flags: flags as CLIStoreInitCmdOptions["flags"],
    });
    return;
  }

  if (subcommand === "clean") {
    const { runCleanStore } = await import("./clean");
    await runCleanStore({ flags });
    return;
  }

  if (subcommand === "repair") {
    const { runRepairStore } = await import("./repair");
    const versions = flags._.slice(4) as string[];

    await runRepairStore({
      versions,
      flags: flags as CLIStoreInitCmdOptions["flags"],
    });
    return;
  }

  if (subcommand === "status") {
    const { runStatusStore } = await import("./status");
    await runStatusStore({ flags });
    return;
  }

  throw new Error(`Invalid subcommand: ${subcommand}`);
}
