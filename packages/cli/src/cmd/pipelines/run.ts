import type { Prettify } from "@luxass/utils";
import type { loadPipelinesFromPaths, PipelineSource } from "@ucdjs/pipelines-loader";
import type { CLIArguments } from "../../cli-utils";
import process from "node:process";
import { createPipelineExecutor } from "@ucdjs/pipelines-executor";
import {
  findPipelineFiles,
  loadPipelineFile,
  parseRemoteSourceUrl,
} from "@ucdjs/pipelines-loader";
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

  // Build sources for the server/UI
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

  if (flags?.ui) {
    const { startServer } = await import("@ucdjs/pipelines-server");
    const port = flags?.port ?? 3030;
    output.info(`Starting Pipeline UI on port ${port}...`);
    for (const label of sourceLabels) {
      output.info(`  ${label}`);
    }
    // Pass sources to the server - it will handle finding and loading files
    await startServer({ port, sources });
    return;
  }

  const selectors = (flags._ ?? []).slice(2).map(String).filter(Boolean);

  output.info("Running pipelines...");
  for (const label of sourceLabels) {
    output.info(`  ${label}`);
  }

  // Find and load pipeline files from sources
  const pipelinePaths: string[] = [];

  for (const source of sources) {
    const files = await findPipelineFiles({
      source: source.type === "local"
        ? { type: "local", cwd: source.cwd }
        : { type: source.type, owner: source.owner, repo: source.repo, ref: source.ref, path: source.path },
      patterns: source.type === "local"
        ? "**/*.ucd-pipeline.ts"
        : (source.path ? `${source.path}/**/*.ucd-pipeline.ts` : "**/*.ucd-pipeline.ts"),
    });
    pipelinePaths.push(...files);
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
