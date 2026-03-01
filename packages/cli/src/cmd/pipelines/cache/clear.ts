import type { CLIArguments } from "../../../cli-utils";
import { clearRemoteSourceCache, getRemoteSourceCacheStatus } from "@ucdjs/pipelines-loader";
import { printHelp } from "../../../cli-utils";
import { CLIError } from "../../../errors";
import {
  blankLine,
  dim,
  green,
  header,
  output,
} from "../../../output";

export interface CLIPipelinesCacheClearCmdOptions {
  flags: CLIArguments<{
    github?: string;
    gitlab?: string;
    ref?: string;
  }>;
}

export async function runPipelinesCacheClear({ flags }: CLIPipelinesCacheClearCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Cache Clear",
      commandName: "ucd pipelines cache clear",
      usage: "[...flags]",
      description: "Remove a source from the local cache.",
      tables: {
        Flags: [
          ["--github <owner/repo>", "Clear cache for a GitHub repository."],
          ["--gitlab <owner/repo>", "Clear cache for a GitLab repository."],
          ["--ref <ref>", "Specific ref to clear. If not specified, clears all refs."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const github = flags?.github as string | undefined;
  const gitlab = flags?.gitlab as string | undefined;
  const ref = flags?.ref as string | undefined;

  // Validate that exactly one source is specified
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

  if (ref) {
    // Clear specific ref
    header(`Clearing ${sourceType}:${owner}/${repo}@${ref}`);

    const status = await getRemoteSourceCacheStatus({
      source: sourceType,
      owner,
      repo,
      ref,
    });

    if (!status.cached) {
      output.info(`${dim("✓")} Not cached (nothing to clear)`);
      return;
    }

    const cleared = await clearRemoteSourceCache({
      source: sourceType,
      owner,
      repo,
      ref,
    });

    if (cleared) {
      output.success(`${green("✓")} Cleared cache`);
      blankLine();
      output.info(`Removed: ${dim(status.cacheDir)}`);
    } else {
      throw new CLIError("Failed to clear cache");
    }
  } else {
    // Clear all refs for this repo - would require listing cached sources and filtering
    // For now, just clear the default "HEAD" ref
    header(`Clearing ${sourceType}:${owner}/${repo} (HEAD)`);

    const status = await getRemoteSourceCacheStatus({
      source: sourceType,
      owner,
      repo,
      ref: "HEAD",
    });

    if (!status.cached) {
      output.info(`${dim("✓")} Not cached (nothing to clear)`);
      return;
    }

    const cleared = await clearRemoteSourceCache({
      source: sourceType,
      owner,
      repo,
      ref: "HEAD",
    });

    if (cleared) {
      output.success(`${green("✓")} Cleared cache`);
      blankLine();
      output.info(`Removed: ${dim(status.cacheDir)}`);
    } else {
      throw new CLIError("Failed to clear cache");
    }
  }
}
