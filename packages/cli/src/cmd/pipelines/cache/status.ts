import type { CLIArguments } from "../../../cli-utils";
import { listCachedSources } from "@ucdjs/pipelines-loader";
import { printHelp } from "../../../cli-utils";
import {
  blankLine,
  clickableLink,
  dim,
  header,
  keyValue,
  output,
} from "../../../output";

export interface CLIPipelinesCacheStatusCmdOptions {
  flags: CLIArguments<{
    github?: string;
    gitlab?: string;
    ref?: string;
  }>;
}

export async function runPipelinesCacheStatus({ flags }: CLIPipelinesCacheStatusCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Cache Status",
      commandName: "ucd pipelines cache status",
      usage: "[...flags]",
      tables: {
        Flags: [
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const sources = await listCachedSources();

  if (sources.length === 0) {
    output.info("No cached sources found.");
    blankLine();
    output.info(`Run ${dim("'ucd pipelines cache refresh --github owner/repo --ref main'")} to sync a remote source.`);
    return;
  }

  header("Cached Sources");
  keyValue("Total", String(sources.length));
  blankLine();

  for (const source of sources) {
    const sourceBaseUrl = `https://${source.source}.com/${source.owner}/${source.repo}`;
    let sourceUrl = sourceBaseUrl;

    // gitlab: https://gitlab.com/luxass/ucdjs-pipelines-gitlab/tree/main
    // github: https://github.com/ucdjs/ucd-pipelines/tree/main
    if (source.ref) {
      sourceUrl += `/tree/${source.ref}`;
    }

    output.info(`${source.source} ${dim("·")} ${clickableLink(`${source.owner}/${source.repo}@${source.ref}`, sourceUrl)}`);
    keyValue("  Commit", clickableLink(source.commitSha.slice(0, 7), `${sourceBaseUrl}/commit/${source.commitSha}`));
    keyValue("  Synced", new Date(source.syncedAt).toLocaleString());
    keyValue("  Location", source.cacheDir);
    blankLine();
  }
}
