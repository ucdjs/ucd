import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import process from "node:process";
import { parseRepoString, printHelp } from "../../cli-utils";
import { output } from "../../output";

export interface CLIPipelinesRunCmdOptions {
  flags: CLIArguments<Prettify<{
    ui: boolean;
    port: number;
    cwd?: string;
    github?: string;
    gitlab?: string;
    ref?: string;
    path?: string;
  }>>;
}

export async function runPipelinesRun({ flags }: CLIPipelinesRunCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Run Pipelines",
      commandName: "ucd pipelines run",
      usage: "[...pipelines] [...flags]",
      tables: {
        Flags: [
          ["--ui", "Run the pipeline with a UI."],
          ["--port <number>", "Port for the UI server (default: 3030)."],
          ["--cwd <path>", "Search for pipeline files from this directory."],
          ["--github <owner/repo>", "Load pipelines from a GitHub repository."],
          ["--gitlab <owner/repo>", "Load pipelines from a GitLab repository."],
          ["--ref <ref>", "Git reference (branch/tag) for remote repositories."],
          ["--path <path>", "Subdirectory path within the repository."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const sources: ({ type: "local"; id: string; cwd: string } | { type: "github"; id: string; owner: string; repo: string; ref?: string; path?: string } | { type: "gitlab"; id: string; owner: string; repo: string; ref?: string; path?: string })[] = [];

  if (flags?.cwd) {
    sources.push({
      type: "local",
      id: "local",
      cwd: flags.cwd,
    });
  }

  if (flags?.github) {
    const { owner, repo } = parseRepoString(flags.github as string);
    sources.push({
      type: "github",
      id: `github-${owner}-${repo}`,
      owner,
      repo,
      ref: flags.ref as string | undefined,
      path: flags.path as string | undefined,
    });
  }

  if (flags?.gitlab) {
    const { owner, repo } = parseRepoString(flags.gitlab as string);
    sources.push({
      type: "gitlab",
      id: `gitlab-${owner}-${repo}`,
      owner,
      repo,
      ref: flags.ref as string | undefined,
      path: flags.path as string | undefined,
    });
  }

  if (sources.length === 0) {
    sources.push({
      type: "local",
      id: "local",
      cwd: process.cwd(),
    });
  }

  if (flags?.ui) {
    const { startServer } = await import("@ucdjs/pipelines-server");
    const port = flags?.port ?? 3030;
    output.info(`Starting Pipeline UI on port ${port}...`);
    for (const source of sources) {
      if (source.type === "local") {
        output.info(`  [local] ${source.cwd}`);
      } else if (source.type === "github") {
        output.info(`  [github] ${source.owner}/${source.repo}${source.ref ? `@${source.ref}` : ""}`);
      } else if (source.type === "gitlab") {
        output.info(`  [gitlab] ${source.owner}/${source.repo}${source.ref ? `@${source.ref}` : ""}`);
      }
    }
    await startServer({ port, sources });
    return;
  }

  output.info("Running pipelines...");
}
