import type { CLIArguments } from "../../../cli-utils";
import {
  getRemoteSourceCacheStatus,
  listCachedSources,
  parseRemoteSourceUrl,
} from "@ucdjs/pipelines-loader";
import { printHelp } from "../../../cli-utils";
import {
  blankLine,
  bold,
  cyan,
  dim,
  green,
  header,
  keyValue,
  output,
  yellow,
} from "../../../output";

export interface CLIPipelinesCacheStatusOptions {
  flags: CLIArguments<{
    github?: string;
    gitlab?: string;
    ref?: string;
  }>;
}

export async function runPipelinesCacheStatus({ flags }: CLIPipelinesCacheStatusOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Pipeline Cache Status",
      commandName: "ucd pipelines cache status",
      usage: "[...flags]",
      tables: {
        Flags: [
          ["--github <owner/repo>", "Show cache status for a GitHub repository."],
          ["--gitlab <owner/repo>", "Show cache status for a GitLab repository."],
          ["--ref <ref>", "Git reference (branch/tag/SHA)."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const sourceFlag = flags?.github ?? flags?.gitlab;
  const sourceType = flags?.github ? "github" : flags?.gitlab ? "gitlab" : null;

  if (!sourceFlag || !sourceType) {
    // No source specified - list all cached sources
    const cached = await listCachedSources();

    header("Cached Pipeline Sources");

    if (cached.length === 0) {
      output.info(`${dim("No cached sources found.")}`);
      output.info(`${dim("Run")} ucd pipelines cache refresh --github <owner/repo> ${dim("to sync a source.")}`);
      blankLine();
      return;
    }

    const colSource = "Source".padEnd(8);
    const colRepo = "Owner/Repo".padEnd(28);
    const colRef = "Ref".padEnd(12);
    const colCommit = "Commit".padEnd(9);
    const colSynced = "Synced At";

    output.info(`  ${bold(colSource)}  ${bold(colRepo)}  ${bold(colRef)}  ${bold(colCommit)}  ${bold(colSynced)}`);
    output.info(`  ${dim("─".repeat(80))}`);

    for (const entry of cached) {
      const syncedAt = new Date(entry.syncedAt).toISOString().replace("T", " ").slice(0, 16);
      const src = entry.source.padEnd(8);
      const repo = `${entry.owner}/${entry.repo}`.padEnd(28);
      const ref = entry.ref.padEnd(12);
      const sha = entry.commitSha.slice(0, 7).padEnd(9);
      output.info(`  ${cyan(src)}  ${repo}  ${dim(ref)}  ${sha}  ${dim(syncedAt)}`);
    }

    blankLine();
    return;
  }

  // Specific source requested
  const ref = flags.ref ?? "HEAD";
  const urlStr = `${sourceType}://${sourceFlag}?ref=${ref}`;
  const parsed = parseRemoteSourceUrl(urlStr);
  if (!parsed) {
    throw new Error(`Invalid ${sourceType} source: ${sourceFlag}`);
  }

  const status = await getRemoteSourceCacheStatus({
    provider: sourceType,
    owner: parsed.owner,
    repo: parsed.repo,
    ref: parsed.ref,
  });

  header(`Cache Status - ${sourceType}:${parsed.owner}/${parsed.repo}@${parsed.ref}`);

  if (!status.cached) {
    keyValue("Status", yellow("not cached"));
    output.info(`\n  ${dim("Run")} ucd pipelines cache refresh --${sourceType} ${sourceFlag} --ref ${ref} ${dim("to sync.")}`);
    blankLine();
    return;
  }

  keyValue("Status", green("cached"));
  keyValue("Commit SHA", status.commitSha);
  keyValue("Synced At", status.syncedAt ? new Date(status.syncedAt).toISOString().replace("T", " ").slice(0, 16) : dim("unknown"));
  keyValue("Cache Dir", dim(status.cacheDir));
  blankLine();
}
