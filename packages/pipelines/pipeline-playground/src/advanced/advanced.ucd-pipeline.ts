import type { ParsedRow, ResolveContext, ResolvedEntry } from "@ucdjs/pipelines-core";
import { always, byExt, definePipeline } from "@ucdjs/pipelines-core";
import {
  auxiliaryRoute,
  blocksRoute,
  emojiDataRoute,
  extractedRoute,
  lineBreakRoute,
  propListRoute,
  scriptsRoute,
  sequencesRoute,
  ucdGeneralRoute,
  unicodeDataRoute,
} from "./routes";
import { emojiSource, ucdSource } from "./sources";

export const playgroundAdvancedPipeline = definePipeline({
  id: "playground-advanced",
  name: "Advanced Pipeline Playground",
  description: "A comprehensive pipeline demonstrating all available features including dependencies, transforms, and multiple sources",
  versions: ["15.0.0", "15.1.0", "16.0.0"],
  inputs: [ucdSource, emojiSource],
  routes: [
    unicodeDataRoute,
    blocksRoute,
    scriptsRoute,
    lineBreakRoute,
    propListRoute,
    sequencesRoute,
    emojiDataRoute,
    ucdGeneralRoute,
    auxiliaryRoute,
    extractedRoute,
  ],
  include: byExt(".txt"),
  strict: false,
  concurrency: 8,
  // @ts-expect-error - Will be fixed
  fallback: {
    filter: always(),
    // @ts-expect-error - Will be fixed
    async* parser(ctx): AsyncIterable<ParsedRow> {
      const content = await ctx.readContent();
      yield {
        sourceFile: ctx.file.path,
        kind: "point",
        value: `fallback: ${content.length} bytes`,
      };
    },
    resolver: async (ctx: ResolveContext, rows: AsyncIterable<ParsedRow>) => {
      const entries: ResolvedEntry[] = [];
      for await (const row of rows) {
        entries.push({
          codePoint: "0000",
          value: row.value ?? "",
        });
      }
      return [{
        version: ctx.version,
        property: "Fallback",
        file: ctx.file.name,
        entries,
      }];
    },
  },
  onEvent: (event) => {
    switch (event.type) {
      case "pipeline:start":
        // eslint-disable-next-line no-console
        console.log(`[Pipeline] Started: ${event.id}`);
        break;
      case "pipeline:end":
        // eslint-disable-next-line no-console
        console.log(`[Pipeline] Completed in ${event.durationMs}ms`);
        break;
      case "version:start":
        // eslint-disable-next-line no-console
        console.log(`[Version] Processing ${event.version}`);
        break;
      case "version:end":
        // eslint-disable-next-line no-console
        console.log(`[Version] ${event.version} completed in ${event.durationMs}ms`);
        break;
      case "file:matched":
        // eslint-disable-next-line no-console
        console.log(`[File] Matched ${event.file.path} -> ${event.routeId}`);
        break;
      case "file:skipped":
        // eslint-disable-next-line no-console
        console.log(`[File] Skipped ${event.file.path}: ${event.reason}`);
        break;
      case "error":
        console.error(`[Error] ${event.error.scope}: ${event.error.message}`);
        break;
    }
  },
});
