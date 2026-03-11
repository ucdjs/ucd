import type { CLIArguments } from "../../../cli-utils";
import {
  clearRemoteSourceCache,
  listCachedSources,
  parseRemoteSourceUrl,
} from "@ucdjs/pipelines-loader";
import { printHelp } from "../../../cli-utils";
import { CLIError } from "../../../errors";
import { blankLine, output } from "../../../output";

export interface CLIPipelinesCacheClearOptions {
  flags: CLIArguments<{
    github?: string;
    gitlab?: string;
    ref?: string;
    all?: boolean;
  }>;
}

export async function runPipelinesCacheClear({ flags }: CLIPipelinesCacheClearOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Pipeline Cache Clear",
      commandName: "ucd pipelines cache clear",
      usage: "[...flags]",
      tables: {
        Flags: [
          ["--github <owner/repo>", "Clear cache for a GitHub repository."],
          ["--gitlab <owner/repo>", "Clear cache for a GitLab repository."],
          ["--ref <ref>", "Git reference (branch/tag/SHA). Defaults to HEAD."],
          ["--all", "Clear all cached sources."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  if (flags?.all) {
    const cached = await listCachedSources();

    if (cached.length === 0) {
      output.info("No cached sources to clear.");
      blankLine();
      return;
    }

    let cleared = 0;
    for (const entry of cached) {
      const ok = await clearRemoteSourceCache({
        provider: entry.source as "github" | "gitlab",
        owner: entry.owner,
        repo: entry.repo,
        ref: entry.ref,
      });
      if (ok) cleared++;
    }

    output.success(`Cleared ${cleared} cached source(s).`);
    blankLine();
    return;
  }

  const sourceFlag = flags?.github ?? flags?.gitlab;
  const sourceType = flags?.github ? "github" : flags?.gitlab ? "gitlab" : null;

  if (!sourceFlag || !sourceType) {
    throw new CLIError("Specify --github <owner/repo>, --gitlab <owner/repo>, or --all.", {
      title: "Cache Clear Error",
    });
  }

  const ref = flags.ref ?? "HEAD";
  const urlStr = `${sourceType}://${sourceFlag}?ref=${ref}`;
  const parsed = parseRemoteSourceUrl(urlStr);
  if (!parsed) {
    throw new Error(`Invalid ${sourceType} source: ${sourceFlag}`);
  }

  const cleared = await clearRemoteSourceCache({
    provider: sourceType,
    owner: parsed.owner,
    repo: parsed.repo,
    ref: parsed.ref,
  });

  if (cleared) {
    output.success(`Cleared cache for ${sourceType}:${parsed.owner}/${parsed.repo}@${parsed.ref}.`);
  } else {
    output.info(`No cached entry found for ${sourceType}:${parsed.owner}/${parsed.repo}@${parsed.ref}.`);
  }
  blankLine();
}
