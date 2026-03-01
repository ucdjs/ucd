import type { CLIArguments } from "../../../cli-utils";
import { printHelp } from "../../../cli-utils";

export interface CLIPipelinesCacheCmdOptions {
  flags: CLIArguments<{
    github?: string;
    gitlab?: string;
    ref?: string;
  }>;
}

const CACHE_SUBCOMMANDS = [
  "status",
  "refresh",
  "clear",
] as const;

export type CacheSubcommand = (typeof CACHE_SUBCOMMANDS)[number];

function isValidSubcommand(subcommand: string): subcommand is CacheSubcommand {
  return CACHE_SUBCOMMANDS.includes(subcommand as CacheSubcommand);
}

export async function runPipelinesCacheRoot(subcommand: string, { flags }: CLIPipelinesCacheCmdOptions) {
  const isValidSub = isValidSubcommand(subcommand);
  const requestsHelp = flags?.help || flags?.h;

  if (!isValidSub || (requestsHelp && !isValidSub)) {
    printHelp({
      commandName: "ucd pipelines cache",
      usage: "[command] [...flags]",
      tables: {
        Commands: [
          ["status", "Show status of all cached pipeline sources."],
          ["refresh", "Sync a remote source to the local cache."],
          ["clear", "Remove a source from the local cache."],
        ],
        Flags: [
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  if (subcommand === "status") {
    const { runPipelinesCacheStatus } = await import("./status");
    await runPipelinesCacheStatus({ flags });
    return;
  }

  if (subcommand === "refresh") {
    const { runPipelinesCacheRefresh } = await import("./refresh");
    await runPipelinesCacheRefresh({ flags });
    return;
  }

  if (subcommand === "clear") {
    const { runPipelinesCacheClear } = await import("./clear");
    await runPipelinesCacheClear({ flags });
    return;
  }

  throw new Error(`Invalid subcommand: ${subcommand}`);
}
