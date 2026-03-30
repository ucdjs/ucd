import type { ParsedRow, PropertyJson, ResolvedEntry } from "@ucdjs/pipelines-core";
import { definePipeline, definePipelineRoute, definePipelineTransform } from "@ucdjs/pipelines-core";
import { standardParser } from "@ucdjs/pipelines-presets";
import { planetsSource } from "../shared/sources";

/**
 * A transform that logs every row it sees using both the context logger and console.log.
 */
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

const planetsRoute = definePipelineRoute({
  id: "planets-logged",

  // Logger is available in the filter context too
  filter: (ctx) => {
    const match = ctx.file.name === "planets.txt";
    ctx.logger.debug("Filter evaluated", { file: ctx.file.name, matched: match });
    return match;
  },

  // Custom parser that uses ctx.logger and console.log
  async* parser(ctx) {
    ctx.logger.info("Parsing started", { file: ctx.file.path });
    // eslint-disable-next-line no-console
    console.log(`[parser] Reading ${ctx.file.name}...`);

    yield* standardParser(ctx);

    ctx.logger.info("Parsing finished");
  },

  transforms: [loggingTransform],

  // Custom resolver that uses ctx.logger and console.log
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
});

export const withLoggingPipeline = definePipeline({
  id: "with-logging",
  name: "With Logging",
  versions: ["1.0.0"],
  inputs: [planetsSource],
  routes: [planetsRoute],
});
