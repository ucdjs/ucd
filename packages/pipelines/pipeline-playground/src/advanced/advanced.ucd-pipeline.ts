import type { ParsedRow, ResolveContext, ResolvedEntry } from "@ucdjs/pipelines-core";
import { always, byExt, definePipeline } from "@ucdjs/pipelines-core";
import { emojiSource, ucdSource } from "../shared/sources";
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
});
