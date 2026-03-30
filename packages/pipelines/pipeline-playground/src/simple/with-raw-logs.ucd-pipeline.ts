import type { ResolvedEntry } from "@ucdjs/pipelines-core";
import { byName, definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";
import { standardParser } from "@ucdjs/pipelines-presets";
import { planetsSource } from "../shared/sources";

/**
 * Uses console.log exclusively (no ctx.logger), so every log entry is stored
 * with a null level. Also demonstrates the args feature: console.log calls with
 * non-string extra arguments (objects, numbers) get those stored in payload.args.
 */
const planetsRoute = definePipelineRoute({
  id: "planets-raw",
  filter: byName("planets.txt"),

  async* parser(ctx) {
    // Plain string → no args stored
    // eslint-disable-next-line no-console
    console.log(`[parser] Reading file: ${ctx.file.name}`);

    // Object arg → stored in payload.args
    // eslint-disable-next-line no-console
    console.log("[parser] File context:", { name: ctx.file.name, path: ctx.file.path });

    yield* standardParser(ctx);

    // eslint-disable-next-line no-console
    console.log(`[parser] Done reading: ${ctx.file.name}`);
  },

  resolver: async (ctx, rows) => {
    // eslint-disable-next-line no-console
    console.log("[resolver] Starting", { version: ctx.version, file: ctx.file.name });

    const entries: ResolvedEntry[] = [];

    for await (const row of rows) {
      if (row.value != null) {
        entries.push({ codePoint: row.codePoint, value: row.value });
      }
    }

    // Number arg → stored in payload.args
    // eslint-disable-next-line no-console
    console.log("[resolver] Resolved entries:", entries.length);

    // Multiple non-string args → all stored in payload.args
    // eslint-disable-next-line no-console
    console.log("[resolver] Summary:", { total: entries.length }, { version: ctx.version, file: ctx.file.name });

    return [{
      version: ctx.version,
      property: "Planets",
      file: ctx.file.name,
      entries,
    }];
  },
});

export const withRawLogsPipeline = definePipeline({
  id: "with-raw-logs",
  name: "With Raw Logs",
  description: "Uses console.log exclusively so every log entry has a null level - useful for testing the null-level UI path.",
  versions: ["1.0.0"],
  inputs: [planetsSource],
  routes: [planetsRoute],
});
