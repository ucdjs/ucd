import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import path from "node:path";
import process from "node:process";
import { findPipelineFiles, loadPipelinesFromPaths } from "@ucdjs/pipelines-loader";
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

export interface CLIPipelinesRunCmdOptions {
  flags: CLIArguments<Prettify<{
    cwd?: string;
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
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const cwd = flags?.cwd ?? process.cwd();

  output.info("Searching for pipeline files...");
  const files = await findPipelineFiles(["**/*.ucd-pipeline.ts"], cwd);

  if (files.length === 0) {
    output.info("No pipeline files found (pattern: **/*.ucd-pipeline.ts).");
    return;
  }

  const result = await loadPipelinesFromPaths(files);
  const totalPipelines = result.pipelines.length;

  header("Pipelines");
  keyValue("Files", String(result.files.length));
  keyValue("Pipelines", String(totalPipelines));
  blankLine();

  for (const f of result.files) {
    const rel = path.relative(cwd, f.filePath);
    output.info(`${dim("•")} ${cyan(rel)}`);

    if (f.exportNames.length === 0) {
      output.info(`  ${dim("(no pipeline exports found)")}`);
      continue;
    }

    const items = f.exportNames.map((name, i) => {
      const pipeline = f.pipelines[i];
      const displayName = pipeline?.name ?? name;
      const id = pipeline?.id;
      const idLabel = id && id !== name && id !== displayName ? ` ${dim(`[${id}]`)}` : "";
      const routesCount = Array.isArray(pipeline?.routes) ? pipeline.routes.length : 0;
      const sourcesCount = Array.isArray(pipeline?.inputs) ? pipeline.inputs.length : 0;
      const details = ` ${dim("·")} ${routesCount} route(s) ${dim("·")} ${sourcesCount} source(s)`;
      const description = pipeline?.description ? ` ${dim("·")} ${pipeline.description}` : "";

      return `${bold(displayName)}${idLabel}${details}${description}`;
    });

    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const prefix = isLast ? "└" : "├";
      output.info(`  ${dim(prefix)} ${item}`);
    });
  }

  if (result.errors.length > 0) {
    blankLine();
    header("Errors");
    for (const e of result.errors) {
      const rel = path.relative(process.cwd(), e.filePath);
      output.error(`  ${yellow("•")} ${rel}: ${e.error.message}`);
    }
  }
}
