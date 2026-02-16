import type { Prettify } from "@luxass/utils";
import type { GitHubSource, GitLabSource, LocalSource } from "@ucdjs/pipelines-loader";
import type { CLIArguments } from "../../cli-utils";
import process from "node:process";
import { createPipelineExecutor } from "@ucdjs/pipelines-executor";
import {
  findPipelineFiles,
  findRemotePipelineFiles,
  loadPipelinesFromPaths,
  loadRemotePipelines,
} from "@ucdjs/pipelines-loader";
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

  const sources: (LocalSource | GitHubSource | GitLabSource)[] = [];

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

  const selectors = (flags._ ?? []).slice(2).map(String).filter(Boolean);

  output.info("Running pipelines...");
  for (const source of sources) {
    if (source.type === "local") {
      output.info(`  [local] ${source.cwd}`);
    } else if (source.type === "github") {
      output.info(`  [github] ${source.owner}/${source.repo}${source.ref ? `@${source.ref}` : ""}`);
    } else if (source.type === "gitlab") {
      output.info(`  [gitlab] ${source.owner}/${source.repo}${source.ref ? `@${source.ref}` : ""}`);
    }
  }

  const allPipelines: Awaited<ReturnType<typeof loadPipelinesFromPaths>>["pipelines"] = [];
  const loadErrors: string[] = [];

  for (const source of sources) {
    try {
      const result = source.type === "local"
        ? await loadPipelinesFromPaths(await findPipelineFiles({ cwd: source.cwd }))
        : await loadRemotePipelines(source, (await findRemotePipelineFiles(source)).files);

      allPipelines.push(...result.pipelines);

      for (const err of result.errors) {
        loadErrors.push(`${source.id}: ${err.filePath} - ${err.error.message}`);
      }
    } catch (error) {
      loadErrors.push(`${source.id}: ${error instanceof Error ? error.message : String(error)}`);
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
