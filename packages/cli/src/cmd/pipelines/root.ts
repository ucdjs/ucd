import type { CLIArguments } from "../../cli-utils";
import { printHelp } from "../../cli-utils";

export interface CLIPipelinesCmdOptions {
  flags: CLIArguments<{
    ui: boolean;
    port: number;
  }>;
}

const PIPELINES_SUBCOMMANDS = [
  "run",
  "list",
  "create",
  "cache",
] as const;
export type Subcommand = (typeof PIPELINES_SUBCOMMANDS)[number];

function isValidSubcommand(subcommand: string): subcommand is Subcommand {
  return PIPELINES_SUBCOMMANDS.includes(subcommand as Subcommand);
}

export async function runPipelinesRoot(subcommand: string, { flags }: CLIPipelinesCmdOptions) {
  const isValidSub = isValidSubcommand(subcommand);
  const requestsHelp = flags?.help || flags?.h;

  if (!isValidSub || (requestsHelp && !isValidSub)) {
    printHelp({
      commandName: "ucd pipelines",
      usage: "[command] [...flags]",
      tables: {
        Commands: [
          ["run", "Run a pipeline from the command line."],
          ["list", "List available pipelines."],
          ["create", "Create a new pipeline scaffold."],
          ["cache", "Manage pipeline source cache (status, clear, refresh)."],
        ],
        Flags: [
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  if (subcommand === "run") {
    const { runPipelinesRun } = await import("./run");
    await runPipelinesRun({
      flags,
    });
    return;
  }

  if (subcommand === "list") {
    const { runListPipelines } = await import("./list");
    await runListPipelines({ flags });
    return;
  }

  // if (subcommand === "create") {
  //   const { runVerifyStore } = await import("./create");
  //   await runVerifyStore({ flags, versions });
  //   return;
  // }

  if (subcommand === "cache") {
    const { runPipelinesCacheRoot } = await import("./cache/index");
    await runPipelinesCacheRoot({ flags });
    return;
  }

  throw new Error(`Invalid subcommand: ${subcommand}`);
}
