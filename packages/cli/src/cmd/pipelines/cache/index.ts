import type { CLIArguments } from "../../../cli-utils";
import { printHelp } from "../../../cli-utils";

export interface CLIPipelinesCacheCmdOptions {
  flags: CLIArguments<{
    github?: string;
    gitlab?: string;
    ref?: string;
    all?: boolean;
    force?: boolean;
  }>;
}

const CACHE_SUBCOMMANDS = ["status", "clear", "refresh"] as const;
type CacheSubcommand = (typeof CACHE_SUBCOMMANDS)[number];

function isValidCacheSubcommand(sub: string): sub is CacheSubcommand {
  return CACHE_SUBCOMMANDS.includes(sub as CacheSubcommand);
}

export async function runPipelinesCacheRoot({ flags }: CLIPipelinesCacheCmdOptions) {
  const subcommand = flags._[2]?.toString() ?? "";
  const requestsHelp = flags?.help || flags?.h;

  if (!isValidCacheSubcommand(subcommand) || requestsHelp) {
    printHelp({
      commandName: "ucd pipelines cache",
      usage: "[command] [...flags]",
      tables: {
        Commands: [
          ["status", "Show cache status for remote pipeline sources."],
          ["clear", "Remove cached remote pipeline sources."],
          ["refresh", "Sync a remote pipeline source to local cache."],
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

  if (subcommand === "clear") {
    const { runPipelinesCacheClear } = await import("./clear");
    await runPipelinesCacheClear({ flags });
    return;
  }

  if (subcommand === "refresh") {
    const { runPipelinesCacheRefresh } = await import("./refresh");
    await runPipelinesCacheRefresh({ flags });
    return;
  }
}
