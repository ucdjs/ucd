import type { ParsedRow, PropertyJson, ResolvedEntry } from "@ucdjs/pipelines-core";
import { byName, definePipeline, definePipelineRoute, definePipelineTransform } from "@ucdjs/pipelines-core";
import { standardParser } from "@ucdjs/pipelines-presets";
import { planetsSource } from "../shared/sources";

const loggingTransform = definePipelineTransform<ParsedRow, ParsedRow>({
  id: "logging-transform",
  async* fn(ctx, rows) {
    let count = 0;

    ctx.logger.error("This is an error message from the transform", { file: ctx.file.path });
    ctx.logger.debug("Transform started", { file: ctx.file.path, version: ctx.version });

    for await (const row of rows) {
      count++;
      ctx.logger.info("Processing row", { kind: row.kind, value: row.value, index: count });
      yield row;
    }

    ctx.logger.debug("Transform finished", { totalRows: count });
    // eslint-disable-next-line no-console
    console.log(`[logging-transform] Processed ${count} rows from ${ctx.file.name}`);
  },
});

/**
 * Demonstrates ctx.logger (error/debug/info/warn) alongside console.log.
 * Log entries carry a level field and are stored by the pipeline-server.
 */
export const withLoggingPipeline = definePipeline({
  id: "with-logging",
  name: "With Logging",
  versions: ["1.0.0"],
  inputs: [planetsSource],
  routes: [
    definePipelineRoute({
      id: "planets-logged",

      filter: (ctx) => {
        const match = ctx.file.name === "planets.txt";
        ctx.logger.debug("Filter evaluated", { file: ctx.file.name, matched: match });
        return match;
      },

      async* parser(ctx) {
        ctx.logger.info("Parsing started", { file: ctx.file.path });
        // eslint-disable-next-line no-console
        console.log(`[parser] Reading ${ctx.file.name}...`);

        yield* standardParser(ctx);

        ctx.logger.info("Parsing finished");
      },

      transforms: [loggingTransform],

      resolver: async (ctx, rows) => {
        ctx.logger.info("Resolver started", { version: ctx.version, file: ctx.file.name });

        const entries: ResolvedEntry[] = [];

        for await (const row of rows as AsyncIterable<ParsedRow>) {
          if (!row.value) {
            ctx.logger.warn("Row has no value, skipping", { codePoint: row.codePoint });
            continue;
          }

          entries.push({ codePoint: row.codePoint, value: row.value });
        }

        // eslint-disable-next-line no-console
        console.log(`[resolver] Resolved ${entries.length} entries from ${ctx.file.name}`);
        ctx.logger.info("Resolver finished", { entriesCount: entries.length, timestamp: ctx.now() });

        return [{
          version: ctx.version,
          property: "Planets",
          file: ctx.file.name,
          entries,
        }] satisfies PropertyJson[];
      },
    }),
  ],
});

/**
 * Uses console.log exclusively (no ctx.logger), so every log entry is stored
 * with a null level. Also demonstrates the args feature: console.log calls with
 * non-string extra arguments (objects, numbers) get those stored in payload.args.
 */
export const withRawLogsPipeline = definePipeline({
  id: "with-raw-logs",
  name: "With Raw Logs",
  description: "Uses console.log exclusively so every log entry has a null level - useful for testing the null-level UI path.",
  versions: ["1.0.0"],
  inputs: [planetsSource],
  routes: [
    definePipelineRoute({
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
    }),
  ],
});
