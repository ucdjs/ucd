import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import { printHelp } from "../../cli-utils";
import { output } from "../../output";

export interface CLIPipelinesRunCmdOptions {
  flags: CLIArguments<Prettify<{
    ui: boolean;
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
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  output.info("Running pipelines...");
}
