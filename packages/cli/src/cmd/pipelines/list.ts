import type { Prettify } from "@luxass/utils";
import type { GitHubSource, GitLabSource, LocalSource } from "@ucdjs/pipelines-loader";
import type { CLIArguments } from "../../cli-utils";
import path from "node:path";
import process from "node:process";
import { findPipelineFiles, findRemotePipelineFiles, loadPipelinesFromPaths, loadRemotePipelines } from "@ucdjs/pipelines-loader";
import { parseRepoString, printHelp } from "../../cli-utils";
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

export interface CLIPipelinesRunCmdOptions {
  flags: CLIArguments<Prettify<{
    cwd?: string;
    github?: string;
    gitlab?: string;
    ref?: string;
    path?: string;
  }>>;
}

export async function runListPipelines({ flags }: CLIPipelinesRunCmdOptions) {
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
          ["--path <path>", "Subdirectory path within the repository."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const sources: (LocalSource | GitHubSource | GitLabSource)[] = [];

  // Local source
  if (flags?.cwd) {
    sources.push({
      type: "local",
      id: "local",
      cwd: flags.cwd,
    });
  }

  // GitHub source
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

  // GitLab source
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

  // Default to local if no sources specified
  if (sources.length === 0) {
    sources.push({
      type: "local",
      id: "local",
      cwd: process.cwd(),
    });
  }

  const allPipelines: {
    filePath: string;
    pipelines: { name: string; id: string; description?: string; routes: number; sources: number }[];
    exportNames: string[];
    sourceId: string;
    sourceType: string;
  }[] = [];
  const allErrors: { filePath: string; message: string; sourceId: string; sourceType: string }[] = [];

  for (const source of sources) {
    try {
      let result;
      if (source.type === "local") {
        const files = await findPipelineFiles({ cwd: (source as LocalSource).cwd });
        result = await loadPipelinesFromPaths(files);
      } else {
        const fileList = await findRemotePipelineFiles(source as GitHubSource | GitLabSource);
        result = await loadRemotePipelines(source as GitHubSource | GitLabSource, fileList.files);
      }

      for (const file of result.files) {
        allPipelines.push({
          filePath: file.filePath,
          exportNames: file.exportNames,
          pipelines: file.pipelines.map((p) => ({
            name: p.name ?? p.id,
            id: p.id,
            description: p.description,
            routes: p.routes.length,
            sources: p.inputs.length,
          })),
          sourceId: source.id,
          sourceType: source.type,
        });
      }

      for (const err of result.errors) {
        allErrors.push({
          filePath: err.filePath,
          message: err.error.message,
          sourceId: source.id,
          sourceType: source.type,
        });
      }
    } catch (err) {
      allErrors.push({
        filePath: "",
        message: err instanceof Error ? err.message : String(err),
        sourceId: source.id,
        sourceType: source.type,
      });
    }
  }

  const totalPipelines = allPipelines.reduce((sum, f) => sum + f.pipelines.length, 0);

  header("Pipelines");
  keyValue("Files", String(allPipelines.length));
  keyValue("Pipelines", String(totalPipelines));
  keyValue("Sources", String(sources.length));
  blankLine();

  // Group by source
  for (const source of sources) {
    const sourcePipelines = allPipelines.filter((p) => p.sourceId === source.id);
    if (sourcePipelines.length === 0) continue;

    if (source.type === "local") {
      output.info(`${cyan("local")} ${dim("·")} ${(source as LocalSource).cwd}`);
    } else if (source.type === "github") {
      const s = source as GitHubSource;
      output.info(`${cyan("github")} ${dim("·")} ${s.owner}/${s.repo}${s.ref ? `@${s.ref}` : ""}`);
    } else if (source.type === "gitlab") {
      const s = source as GitLabSource;
      output.info(`${cyan("gitlab")} ${dim("·")} ${s.owner}/${s.repo}${s.ref ? `@${s.ref}` : ""}`);
    }
    blankLine();

    for (const f of sourcePipelines) {
      if (source.type === "local") {
        const rel = path.relative((source as LocalSource).cwd, f.filePath);
        output.info(`${dim("•")} ${cyan(rel)}`);
      } else {
        output.info(`${dim("•")} ${cyan(f.filePath)}`);
      }

      if (f.exportNames.length === 0) {
        output.info(`  ${dim("(no pipeline exports found)")}`);
        continue;
      }

      const items = f.pipelines.map((p, i) => {
        const displayName = p.name ?? f.exportNames[i] ?? "default";
        const idLabel = p.id && p.id !== displayName ? ` ${dim(`[${p.id}]`)}` : "";
        const routesCount = p.routes ?? 0;
        const sourcesCount = p.sources ?? 0;
        const details = ` ${dim("·")} ${routesCount} route(s) ${dim("·")} ${sourcesCount} source(s)`;
        const description = p.description ? ` ${dim("·")} ${p.description}` : "";

        return `${bold(displayName)}${idLabel}${details}${description}`;
      });

      items.forEach((item, index) => {
        const isLast = index === items.length - 1;
        const prefix = isLast ? "└" : "├";
        output.info(`  ${dim(prefix)} ${item}`);
      });
    }

    blankLine();
  }

  if (allErrors.length > 0) {
    header("Errors");
    for (const e of allErrors) {
      let sourceLabel = "";
      if (e.sourceType === "local") {
        sourceLabel = "[local] ";
      } else if (e.sourceType === "github") {
        sourceLabel = "[github] ";
      } else if (e.sourceType === "gitlab") {
        sourceLabel = "[gitlab] ";
      }
      output.error(`  ${yellow("•")} ${sourceLabel}${e.filePath}: ${e.message}`);
    }
  }
}
