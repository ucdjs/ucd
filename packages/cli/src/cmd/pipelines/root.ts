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

export async function runPipelinesRoot(subcommand: string, args: string[], { flags }: CLIPipelinesCmdOptions) {
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
          ["cache", "Manage cached pipeline sources."],
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

  if (subcommand === "cache") {
    const cacheSubcommand = args[0] ?? "";
    const cacheArgs = args.slice(1);
    const { runPipelinesCacheRoot } = await import("./cache/root");
    await runPipelinesCacheRoot(cacheSubcommand, { flags });
    return;
  }

  // if (subcommand === "create") {
  //   const { runVerifyStore } = await import("./create");
  //   await runVerifyStore({ flags, versions });
  //   return;
  // }

  throw new Error(`Invalid subcommand: ${subcommand}`);
}
