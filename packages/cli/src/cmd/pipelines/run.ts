import type { Prettify } from "@luxass/utils";
import type {
  loadPipelinesFromPaths,
} from "@ucdjs/pipelines-loader";
import type { CLIArguments } from "../../cli-utils";
import process from "node:process";
import { createPipelineExecutor } from "@ucdjs/pipelines-executor";
import {
  findPipelineFiles,
  loadPipelineFile,
} from "@ucdjs/pipelines-loader";
import { downloadGitHubRepo, downloadGitLabRepo } from "@ucdjs/pipelines-loader/cache";
import { parseRepoString, printHelp } from "../../cli-utils";
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

  // Collect pipeline file paths/URLs to load
  const pipelinePaths: string[] = [];
  const sourceLabels: string[] = [];

  if (flags?.github) {
    const { owner, repo } = parseRepoString(flags.github as string);
    const ref = (flags.ref as string) || "HEAD";
    const subPath = (flags.path as string) || "";

    // Download the repo to cache
    const cacheDir = await downloadGitHubRepo({ owner, repo, ref });
    sourceLabels.push(`[github] ${owner}/${repo}${ref !== "HEAD" ? `@${ref}` : ""}`);

    // Find pipeline files in the cached repo
    const files = await findPipelineFiles({
      source: { type: "local", cwd: cacheDir },
      patterns: subPath ? `${subPath}/**/*.ucd-pipeline.ts` : "**/*.ucd-pipeline.ts",
    });

    pipelinePaths.push(...files);
  }

  if (flags?.gitlab) {
    const { owner, repo } = parseRepoString(flags.gitlab as string);
    const ref = (flags.ref as string) || "HEAD";
    const subPath = (flags.path as string) || "";

    // Download the repo to cache
    const cacheDir = await downloadGitLabRepo({ owner, repo, ref });
    sourceLabels.push(`[gitlab] ${owner}/${repo}${ref !== "HEAD" ? `@${ref}` : ""}`);

    // Find pipeline files in the cached repo
    const files = await findPipelineFiles({
      source: { type: "local", cwd: cacheDir },
      patterns: subPath ? `${subPath}/**/*.ucd-pipeline.ts` : "**/*.ucd-pipeline.ts",
    });

    pipelinePaths.push(...files);
  }

  // Local source (default if no remote specified)
  if (pipelinePaths.length === 0 || flags?.cwd) {
    const cwd = (flags?.cwd as string) || process.cwd();
    sourceLabels.push(`[local] ${cwd}`);

    const files = await findPipelineFiles({ source: { type: "local", cwd } });
    pipelinePaths.push(...files);
  }

  if (flags?.ui) {
    const { startServer } = await import("@ucdjs/pipelines-server");
    const port = flags?.port ?? 3030;
    output.info(`Starting Pipeline UI on port ${port}...`);
    for (const label of sourceLabels) {
      output.info(`  ${label}`);
    }
    // TODO: Update server to work with new approach
    await startServer({ port, pipelinePaths });
    return;
  }

  const selectors = (flags._ ?? []).slice(2).map(String).filter(Boolean);

  output.info("Running pipelines...");
  for (const label of sourceLabels) {
    output.info(`  ${label}`);
  }

  // Load all pipelines
  const allPipelines: Awaited<ReturnType<typeof loadPipelinesFromPaths>>["pipelines"] = [];
  const loadErrors: string[] = [];

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
    const matched = new Set(selectedPipelines.flatMap((p) => [p.id, p.name].filter(Boolean) as string[]));
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
