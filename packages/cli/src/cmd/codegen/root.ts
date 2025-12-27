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
  const isValidSub = isValidSubcommand(subcommand);
  const requestsHelp = flags?.help || flags?.h;

  if (!isValidSub || (requestsHelp && !isValidSub)) {
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
    const inputPath = flags._.slice(4)?.toString() ?? "";

    await runFieldCodegen({
      inputPath,
      flags: flags as CLICodegenFieldsCmdOptions["flags"],
    });
    return;
  }

  throw new Error(`Invalid subcommand: ${subcommand}`);
}
