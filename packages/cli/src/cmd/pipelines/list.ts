import type { CLIArguments } from "../../cli-utils";
import type { Prettify } from "../../types";
import path from "node:path";
import process from "node:process";
import {
  loadPipelinesFromPaths,
  materializePipelineLocator,
} from "@ucdjs/pipelines-loader";
import { discoverPipelineFiles } from "@ucdjs/pipelines-loader/discover";
import { printHelp } from "../../cli-utils";
import { CLIError } from "../../errors";
import {
  blankLine,
  bold,
  cyan,
  dim,
  header,
  keyValue,
  output,
  yellow,
} from "../../output";

export interface CLIPipelinesListCmdOptions {
  flags: CLIArguments<Prettify<{
    cwd?: string;
    github?: string;
    gitlab?: string;
    ref?: string;
    path?: string;
  }>>;
}

export async function runListPipelines({ flags }: CLIPipelinesListCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "List Pipelines",
      commandName: "ucd pipelines list",
      usage: "[...flags]",
      tables: {
        Flags: [
          ["--cwd <path>", "Search for pipeline files from this directory."],
          ["--github <owner/repo>", "Load pipelines from a GitHub repository."],
          ["--gitlab <owner/repo>", "Load pipelines from a GitLab repository."],
          ["--ref <ref>", "Git reference (branch/tag) for remote repositories."],
          ["--path <path>", "Subdirectory path within the repository or local directory."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  let sourceLabel: string;
  let sourceType: "local" | "github" | "gitlab";
  let locator: {
    kind: "local";
    path: string;
  } | {
    kind: "remote";
    provider: "github" | "gitlab";
    owner: string;
    repo: string;
    ref?: string;
    path?: string;
  };

  if (flags?.github || flags?.gitlab) {
    const provider = flags.github ? "github" : "gitlab";
    const remote = String(flags.github ?? flags.gitlab);
    const [owner, repo] = remote.split("/");

    if (!owner || !repo) {
      throw new CLIError(`Specify --${provider} as <owner/repo>.`);
    }

    const ref = String(flags.ref ?? "HEAD");
    locator = {
      kind: "remote",
      provider,
      owner,
      repo,
      ref,
      path: flags.path,
    };
    sourceType = provider;
    sourceLabel = `${owner}/${repo}${ref !== "HEAD" ? `@${ref}` : ""}`;
  } else {
    const cwd = String(flags.cwd ?? process.cwd());
    const localPath = flags.path ? path.join(cwd, flags.path) : cwd;
    locator = {
      kind: "local",
      path: localPath,
    };
    sourceType = "local";
    sourceLabel = localPath;
  }

  const materialized = await materializePipelineLocator(locator);

  if (materialized.issues.length > 0) {
    header("Errors");
    for (const issue of materialized.issues) {
      output.error(`  ${yellow("•")} ${issue.message}`);
    }
    blankLine();
    return;
  }

  const discovery = materialized.filePath
    ? {
        files: [{
          filePath: materialized.filePath,
          relativePath: materialized.relativePath ?? path.basename(materialized.filePath),
        }],
        issues: [],
      }
    : await discoverPipelineFiles({
        repositoryPath: materialized.repositoryPath!,
        ...(materialized.origin ? { origin: materialized.origin } : {}),
      });

  const result = await loadPipelinesFromPaths(discovery.files.map((file) => file.filePath));
  const discoveredFiles = new Map(discovery.files.map((file) => [file.filePath, file]));

  const loadedFiles = result.files.map((file) => {
    const discovered = discoveredFiles.get(file.filePath);
    return {
      relativePath: discovered?.relativePath ?? file.filePath,
      exportNames: file.exportNames,
      pipelines: file.pipelines.map((pipeline) => ({
        name: pipeline.name ?? pipeline.id,
        id: pipeline.id,
        description: pipeline.description,
        routes: pipeline.routes.length,
        sources: pipeline.inputs.length,
      })),
    };
  });

  header("Pipelines");
  keyValue("Files", String(loadedFiles.length));
  keyValue("Pipelines", String(loadedFiles.reduce((sum, file) => sum + file.pipelines.length, 0)));
  blankLine();

  output.info(`${cyan(sourceType)} ${dim("·")} ${sourceLabel}`);
  blankLine();

  for (const file of loadedFiles) {
    output.info(`${dim("•")} ${cyan(file.relativePath)}`);

    if (file.exportNames.length === 0) {
      output.info(`  ${dim("(no pipeline exports found)")}`);
      continue;
    }

    file.pipelines.map((pipeline, index) => {
      const displayName = pipeline.name ?? file.exportNames[index] ?? "default";
      const idLabel = pipeline.id !== displayName ? ` ${dim(`[${pipeline.id}]`)}` : "";
      const details = ` ${dim("·")} ${pipeline.routes} route(s) ${dim("·")} ${pipeline.sources} source(s)`;
      const description = pipeline.description ? ` ${dim("·")} ${pipeline.description}` : "";
      return `${bold(displayName)}${idLabel}${details}${description}`;
    }).forEach((item, index, items) => {
      output.info(`  ${dim(index === items.length - 1 ? "└" : "├")} ${item}`);
    });
  }

  blankLine();

  const issues = [...discovery.issues, ...result.issues];
  if (issues.length > 0) {
    header("Errors");
    for (const issue of issues) {
      output.error(`  ${yellow("•")} ${issue.filePath ? `${issue.filePath}: ` : ""}${issue.message}`);
    }
  }
}
