import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import { printHelp } from "../../cli-utils";
import { output } from "../../output";

export interface CLIPipelinesRunCmdOptions {
  flags: CLIArguments<Prettify<{
    ui: boolean;
    port: number;
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
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  if (flags?.ui) {
    const { startServer } = await import("@ucdjs/pipelines-server");
    const port = flags?.port ?? 3030;
    output.info(`Starting Pipeline UI on port ${port}...`);
    startServer({ port });
    return;
  }

  output.info("Running pipelines...");
}
