import type { CLIArguments } from "../../cli-utils";
import type { CLICodegenFieldsCmdOptions } from "./fields";
import { printHelp } from "../../cli-utils";

export interface CLICodegenCmdOptions {
  flags: CLIArguments<{
    outputDir: string;
    outputFile: string;
    inputDir: string;
  }>;
}

const CODEGEN_SUBCOMMANDS = [
  "fields",
] as const;
export type Subcommand = (typeof CODEGEN_SUBCOMMANDS)[number];

function isValidSubcommand(subcommand: string): subcommand is Subcommand {
  return CODEGEN_SUBCOMMANDS.includes(subcommand as Subcommand);
}

export async function runCodegenRoot(subcommand: string, { flags }: CLICodegenCmdOptions) {
  if (!isValidSubcommand(subcommand) || flags?.help || flags?.h) {
    printHelp({
      commandName: "ucd codegen",
      usage: "[command] [...flags]",
      tables: {
        Commands: [
          ["fields", "Generate fields for the Unicode data files."],
        ],
        Flags: [
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  if (subcommand === "fields") {
    const { runFieldCodegen } = await import("./fields");
    await runFieldCodegen({
      flags: flags as CLICodegenFieldsCmdOptions["flags"],
    });
    return;
  }

  throw new Error(`Invalid subcommand: ${subcommand}`);
}
