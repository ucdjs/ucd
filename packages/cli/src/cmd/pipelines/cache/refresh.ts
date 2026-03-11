import type { CLIArguments } from "../../../cli-utils";
import { ensureRemoteLocator, parseRemoteSourceUrl } from "@ucdjs/pipelines-loader";
import { printHelp } from "../../../cli-utils";
import { CLIError } from "../../../errors";
import { blankLine, dim, green, output, yellow } from "../../../output";

export interface CLIPipelinesCacheRefreshOptions {
  flags: CLIArguments<{
    github?: string;
    gitlab?: string;
    ref?: string;
    force?: boolean;
  }>;
}

export async function runPipelinesCacheRefresh({ flags }: CLIPipelinesCacheRefreshOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Pipeline Cache Refresh",
      commandName: "ucd pipelines cache refresh",
      usage: "[...flags]",
      tables: {
        Flags: [
          ["--github <owner/repo>", "Sync a GitHub repository to local cache."],
          ["--gitlab <owner/repo>", "Sync a GitLab repository to local cache."],
          ["--ref <ref>", "Git reference (branch/tag/SHA). Defaults to HEAD."],
          ["--force", "Re-download even if already up to date."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const sourceFlag = flags?.github ?? flags?.gitlab;
  const sourceType = flags?.github ? "github" : flags?.gitlab ? "gitlab" : null;

  if (!sourceFlag || !sourceType) {
    throw new CLIError("Specify --github <owner/repo> or --gitlab <owner/repo>.", {
      title: "Cache Refresh Error",
    });
  }

  const ref = flags.ref ?? "HEAD";
  const urlStr = `${sourceType}://${sourceFlag}?ref=${ref}`;
  const parsed = parseRemoteSourceUrl(urlStr);
  if (!parsed) {
    throw new Error(`Invalid ${sourceType} source: ${sourceFlag}`);
  }

  output.info(`Syncing ${sourceType}:${parsed.owner}/${parsed.repo}@${parsed.ref}…`);
  output.info(`  ${dim("Resolving ref…")}`);

  const syncResult = await ensureRemoteLocator({
    provider: sourceType,
    owner: parsed.owner,
    repo: parsed.repo,
    ref: parsed.ref,
    force: !!flags.force,
  });

  if (!syncResult.success) {
    throw new CLIError(syncResult.error?.message ?? "Sync failed.", {
      title: "Cache Refresh Error",
    });
  }

  const shaShort = syncResult.newSha.slice(0, 7);

  if (syncResult.updated) {
    const prevShort = syncResult.previousSha ? syncResult.previousSha.slice(0, 7) : null;
    const updateMsg = prevShort ? `${prevShort} → ${shaShort}` : shaShort;
    output.success(`Done. ${green(updateMsg)} ${dim("(updated)")}`);
  } else {
    output.success(`Done. ${shaShort} ${yellow("(already up to date)")}`);
  }

  blankLine();
}
