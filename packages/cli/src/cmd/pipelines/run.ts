import type { CLIArguments } from "../../cli-utils";
import type { Prettify } from "../../types";
import path from "node:path";
import process from "node:process";
import { createPipelineExecutor } from "@ucdjs/pipeline-executor";
import {
  loadPipelineFile,
  materializePipelineLocator,
} from "@ucdjs/pipeline-loader";
import { discoverPipelineFiles } from "@ucdjs/pipeline-loader/discover";
import { printHelp } from "../../cli-utils";
import { CLIError } from "../../errors";
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

  const sources: Array<{
    id: string;
    kind: "local";
    path: string;
  } | {
    id: string;
    kind: "remote";
    provider: "github" | "gitlab";
    owner: string;
    repo: string;
    ref?: string;
    path?: string;
  }> = [];

  if (flags?.github) {
    const [owner, repo] = String(flags.github).split("/");
    if (!owner || !repo) {
      throw new CLIError("Specify --github as <owner/repo>.");
    }

    sources.push({
      id: `github-${owner}-${repo}`,
      kind: "remote",
      provider: "github",
      owner,
      repo,
      ref: String(flags.ref ?? "HEAD"),
      path: flags.path,
    });
  }

  if (flags?.gitlab) {
    const [owner, repo] = String(flags.gitlab).split("/");
    if (!owner || !repo) {
      throw new CLIError("Specify --gitlab as <owner/repo>.");
    }

    sources.push({
      id: `gitlab-${owner}-${repo}`,
      kind: "remote",
      provider: "gitlab",
      owner,
      repo,
      ref: String(flags.ref ?? "HEAD"),
      path: flags.path,
    });
  }

  if (sources.length === 0 || flags?.cwd) {
    const cwd = String(flags.cwd ?? process.cwd());
    sources.push({
      id: "local",
      kind: "local",
      path: flags.path ? path.join(cwd, String(flags.path)) : cwd,
    });
  }

  if (flags?.ui) {
    const { startServer } = await import("@ucdjs/pipeline-server");
    const port = flags?.port ?? 3030;
    output.info(`Starting Pipeline UI on port ${port}...`);
    for (const source of sources) {
      if (source.kind === "local") {
        output.info(`  [local] ${source.path}`);
      } else {
        output.info(`  [${source.provider}] ${source.owner}/${source.repo}${source.ref && source.ref !== "HEAD" ? `@${source.ref}` : ""}`);
      }
    }
    await startServer({ port, sources });
    return;
  }

  const selectors = (flags._ ?? []).slice(2).map(String).filter(Boolean);

  output.info("Running pipelines...");
  for (const source of sources) {
    if (source.kind === "local") {
      output.info(`  [local] ${source.path}`);
    } else {
      output.info(`  [${source.provider}] ${source.owner}/${source.repo}${source.ref && source.ref !== "HEAD" ? `@${source.ref}` : ""}`);
    }
  }

  const pipelinePaths: string[] = [];
  const loadErrors: string[] = [];

  for (const source of sources) {
    const { id: _id, ...locator } = source;
    const materialized = await materializePipelineLocator(locator);

    if (materialized.issues.length > 0) {
      loadErrors.push(...materialized.issues.map((issue) => issue.message));
      continue;
    }

    if (materialized.filePath) {
      pipelinePaths.push(materialized.filePath);
      continue;
    }

    const discovery = await discoverPipelineFiles({
      repositoryPath: materialized.repositoryPath!,
      ...(materialized.origin ? { origin: materialized.origin } : {}),
    });

    pipelinePaths.push(...discovery.files.map((file) => file.filePath));
    loadErrors.push(...discovery.issues.map((issue) => issue.message));
  }

  const allPipelines = [];
  for (const filePath of pipelinePaths) {
    try {
      const result = await loadPipelineFile(filePath);
      allPipelines.push(...result.pipelines);
    } catch (error) {
      loadErrors.push(`${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (allPipelines.length === 0) {
    throw new CLIError("No pipelines found to run.", {
      details: loadErrors.length > 0 ? loadErrors : undefined,
    });
  }

  const selectedPipelines = selectors.length > 0
    ? allPipelines.filter((pipeline) => selectors.includes(pipeline.id) || (!!pipeline.name && selectors.includes(pipeline.name)))
    : allPipelines;

  if (selectors.length > 0) {
    const matched = new Set(selectedPipelines.flatMap((pipeline) => [pipeline.id, pipeline.name].filter(Boolean) as string[]));
    const missing = selectors.filter((selector) => !matched.has(selector));
    if (missing.length > 0) {
      output.warning(`Unknown pipeline selector(s): ${missing.join(", ")}`);
    }
  }

  if (selectedPipelines.length === 0) {
    throw new CLIError("No pipelines matched the provided selectors.");
  }

  output.info(`Executing ${selectedPipelines.length} pipeline(s)...`);

  const executor = createPipelineExecutor({});
  const results = await executor.run(selectedPipelines);

  let failed = 0;
  for (const result of results) {
    if (result.status === "failed" || result.errors.length > 0) {
      failed += 1;
      output.error(`✗ ${result.id} failed (${result.errors.length} error(s))`);
      continue;
    }

    output.success(`✓ ${result.id} completed in ${result.summary.durationMs}ms (${result.summary.totalOutputs} output(s))`);
  }

  if (failed > 0) {
    throw new CLIError(`${failed} pipeline(s) failed.`);
  }
}
