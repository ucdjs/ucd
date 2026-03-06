import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import path from "node:path";
import process from "node:process";
import {
  findPipelineFiles,
  loadPipelinesFromPaths,
  parseRemoteSourceUrl,
} from "@ucdjs/pipelines-loader";
import { printHelp } from "../../cli-utils";
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

  // Build the source for findPipelineFiles
  let source: {
    type: "local";
    cwd: string;
  } | {
    type: "github";
    owner: string;
    repo: string;
    ref?: string;
    path?: string;
  } | {
    type: "gitlab";
    owner: string;
    repo: string;
    ref?: string;
    path?: string;
  };
  let label: string;

  if (flags?.github) {
    const ref = flags.ref ?? "HEAD";
    const urlStr = `github://${flags.github}?ref=${ref}${flags.path ? `&path=${flags.path}` : ""}`;
    const parsed = parseRemoteSourceUrl(urlStr);
    if (!parsed) throw new Error(`Invalid github source: ${flags.github}`);
    source = { type: "github", owner: parsed.owner, repo: parsed.repo, ref: parsed.ref, path: flags.path };
    label = `${parsed.owner}/${parsed.repo}${ref !== "HEAD" ? `@${ref}` : ""}`;
  } else if (flags?.gitlab) {
    const ref = flags.ref ?? "HEAD";
    const urlStr = `gitlab://${flags.gitlab}?ref=${ref}${flags.path ? `&path=${flags.path}` : ""}`;
    const parsed = parseRemoteSourceUrl(urlStr);
    if (!parsed) throw new Error(`Invalid gitlab source: ${flags.gitlab}`);
    source = { type: "gitlab", owner: parsed.owner, repo: parsed.repo, ref: parsed.ref, path: flags.path };
    label = `${parsed.owner}/${parsed.repo}${ref !== "HEAD" ? `@${ref}` : ""}`;
  } else {
    const cwd = flags.cwd || process.cwd();
    source = { type: "local", cwd };
    label = cwd;
  }

  // Find files using the unified API (handles downloading automatically)
  const pattern = flags.path
    ? `${flags.path}/**/*.ucd-pipeline.ts`
    : "**/*.ucd-pipeline.ts";

  const files = await findPipelineFiles({ source, patterns: pattern });
  const result = await loadPipelinesFromPaths(files);

  const allPipelines = result.files.map((file) => ({
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

  const totalPipelines = allPipelines.reduce((sum, f) => sum + f.pipelines.length, 0);

  header("Pipelines");
  keyValue("Files", String(allPipelines.length));
  keyValue("Pipelines", String(totalPipelines));
  blankLine();

  // Show source label
  output.info(`${cyan(source.type)} ${dim("·")} ${label}`);
  blankLine();

  // List pipelines
  for (const f of allPipelines) {
    if (source.type === "local") {
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

  blankLine();

  if (result.errors.length > 0) {
    header("Errors");
    for (const err of result.errors) {
      const sourceLabel = source.type === "local" ? "[local] " : `[${source.type}] `;
      output.error(`  ${yellow("•")} ${sourceLabel}${err.filePath}: ${err.error.message}`);
    }
  }
}
