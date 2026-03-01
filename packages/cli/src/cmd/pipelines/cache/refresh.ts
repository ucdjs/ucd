import type { CLIArguments } from "../../../cli-utils";
import { syncRemoteSource } from "@ucdjs/pipelines-loader";
import { printHelp } from "../../../cli-utils";
import { CLIError } from "../../../errors";
import {
  blankLine,
  dim,
  green,
  header,
  output,
  yellow,
} from "../../../output";

export interface CLIPipelinesCacheRefreshCmdOptions {
  flags: CLIArguments<{
    github?: string;
    gitlab?: string;
    ref?: string;
  }>;
}

export async function runPipelinesCacheRefresh({ flags }: CLIPipelinesCacheRefreshCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Cache Refresh",
      commandName: "ucd pipelines cache refresh",
      usage: "[...flags]",
      description: "Sync a remote source to the local cache. The source can be specified using --github or --gitlab flags.",
      tables: {
        Flags: [
          ["--github <owner/repo>", "GitHub repository to sync (e.g., ucdjs/demo-pipelines)."],
          ["--gitlab <owner/repo>", "GitLab repository to sync (e.g., mygroup/demo)."],
          ["--ref <ref>", "Git reference (branch/tag/SHA). Defaults to HEAD."],
          ["--force", "Force re-download even if already cached."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const github = flags?.github as string | undefined;
  const gitlab = flags?.gitlab as string | undefined;
  const ref = (flags?.ref as string | undefined) ?? "HEAD";
  const force = flags?.force as boolean | undefined;

  // Validate that exactly one source is specified
  // Future consideration: Support shorthand syntax like "github:owner/repo@ref"
  if (!github && !gitlab) {
    throw new CLIError("No source specified. Use --github or --gitlab to specify a remote source.");
  }

  if (github && gitlab) {
    throw new CLIError("Cannot specify both --github and --gitlab. Choose one source.");
  }

  let sourceType: "github" | "gitlab";
  let owner: string;
  let repo: string;

  if (github) {
    sourceType = "github";
    const parts = github.split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new CLIError(`Invalid GitHub repository format: ${github}. Expected: owner/repo`);
    }
    owner = parts[0]!;
    repo = parts[1]!;
  } else {
    sourceType = "gitlab";
    const parts = gitlab!.split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new CLIError(`Invalid GitLab repository format: ${gitlab}. Expected: owner/repo`);
    }
    owner = parts[0]!;
    repo = parts[1]!;
  }

  header(`Syncing ${sourceType}:${owner}/${repo}@${ref}`);

  const result = await syncRemoteSource({
    source: sourceType,
    owner,
    repo,
    ref,
    force: force ?? false,
  });

  if (!result.success) {
    throw new CLIError(`Failed to sync: ${result.error?.message ?? "Unknown error"}`);
  }

  if (result.updated) {
    if (result.previousSha) {
      output.success(`${green("✓")} Updated from ${result.previousSha.slice(0, 7)} to ${result.newSha.slice(0, 7)}`);
    } else {
      output.success(`${green("✓")} Downloaded ${result.newSha.slice(0, 7)}`);
    }
  } else {
    output.info(`${dim("✓")} Already up to date (${result.newSha.slice(0, 7)})`);
  }

  blankLine();
  output.info(`Cached at: ${dim(result.cacheDir)}`);
}
