import type { Prettify } from "@luxass/utils";
import type { PipelineSource } from "@ucdjs/pipelines-loader";
import type { CLIArguments } from "../../cli-utils";
import path from "node:path";
import process from "node:process";
import {
  findPipelineFiles,
  loadPipelinesFromPaths,
  parseRemoteSourceUrl,
} from "@ucdjs/pipelines-loader";
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
          ["--path <path>", "Subdirectory path within the repository."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  // Build sources for listing pipelines
  const sources: PipelineSource[] = [];
  const sourceLabels: string[] = [];

  function addRemoteSource(
    flagName: "github" | "gitlab",
    flagValue: string | undefined,
  ) {
    if (!flagValue) return;
    const repoInfo = parseRemoteSourceUrl(flagValue);
    if (!repoInfo) {
      throw new CLIError(`Invalid ${flagName} repository URL: ${flagValue}`);
    }
    const { type, owner, repo } = repoInfo;
    const ref = flags.ref || "HEAD";
    const subPath = flags.path || undefined;
    const sourceId = `${type}-${owner}-${repo}`;

    sources.push({ type, id: sourceId, owner, repo, ref, path: subPath });
    sourceLabels.push(`[${type}] ${owner}/${repo}${ref !== "HEAD" ? `@${ref}` : ""}`);
  }

  addRemoteSource("github", flags?.github);
  addRemoteSource("gitlab", flags?.gitlab);

  // Local source (default if no remote specified)
  if (sources.length === 0 || flags?.cwd) {
    const cwd = flags.cwd || process.cwd();
    sources.push({
      type: "local",
      id: "local",
      cwd,
    });
    sourceLabels.push(`[local] ${cwd}`);
  }

  // Find files from all sources
  const allFiles: Array<{
    source: PipelineSource;
    sourceLabel: string;
    files: Awaited<ReturnType<typeof findPipelineFiles>>;
  }> = [];

  const pattern = flags.path
    ? `${flags.path}/**/*.ucd-pipeline.ts`
    : "**/*.ucd-pipeline.ts";

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i]!;
    const sourceLabel = sourceLabels[i]!;
    const findSource = source.type === "local"
      ? { type: "local" as const, cwd: source.cwd }
      : { type: source.type, owner: source.owner!, repo: source.repo!, ref: source.ref, path: source.path };
    const files = await findPipelineFiles({
      source: findSource,
      patterns: pattern,
    });
    allFiles.push({ source, sourceLabel, files });
  }

  // Load pipelines from all files
  const allResults: Array<{
    source: PipelineSource;
    sourceLabel: string;
    result: Awaited<ReturnType<typeof loadPipelinesFromPaths>>;
  }> = [];

  for (const { source, sourceLabel, files } of allFiles) {
    const result = await loadPipelinesFromPaths(files);
    allResults.push({ source, sourceLabel, result });
  }

  // Aggregate statistics
  const totalFiles = allResults.reduce((sum, r) => sum + r.result.files.length, 0);
  const totalPipelines = allResults.reduce(
    (sum, r) => sum + r.result.files.reduce((s, f) => s + f.pipelines.length, 0),
    0,
  );

  header("Pipelines");
  keyValue("Files", String(totalFiles));
  keyValue("Pipelines", String(totalPipelines));
  blankLine();

  // List pipelines by source
  for (const { source, sourceLabel, result } of allResults) {
    output.info(`${cyan(source.type)} ${dim("·")} ${sourceLabel}`);
    blankLine();

    const files = result.files.map((file) => ({
      filePath: file.filePath,
      exportNames: file.exportNames,
      pipelines: file.pipelines.map((p) => ({
        name: p.name ?? p.id,
        id: p.id,
        description: p.description,
        routes: p.routes.length,
        sources: p.inputs.length,
      })),
    }));

    for (const f of files) {
      if (source.type === "local" && "cwd" in source) {
        const rel = path.relative(source.cwd, f.filePath);
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

    if (result.errors.length > 0) {
      output.warn("");
      output.warn(`Errors in ${sourceLabel}:`);
      for (const err of result.errors) {
        output.error(`  ${yellow("•")} ${err.filePath}: ${err.error.message}`);
      }
    }

    blankLine();
  }
}
