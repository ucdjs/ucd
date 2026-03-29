import type { ResolvedEntry } from "@ucdjs/pipelines-core";
import { byName, definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";
import { standardParser } from "@ucdjs/pipelines-presets";
import { colorsSource, planetsSource, sizesSource } from "../shared.sources";

/**
 * Each route writes to a distinct directory and static file name so the
 * pipeline-server UI shows a concrete "Directory / File name" output box
 * for every route in the inspect → outputs view.
 */

const colorsRoute = definePipelineRoute({
  id: "colors",
  filter: byName("colors.txt"),
  parser: standardParser,
  resolver: async (ctx, rows) => {
    ctx.logger.info("Resolving colors", { file: ctx.file.name, version: ctx.version });
    const entries: ResolvedEntry[] = [];
    for await (const row of rows) {
      if (row.value != null) entries.push({ codePoint: row.codePoint, value: row.value });
    }
    ctx.logger.debug("Colors resolved", { count: entries.length });
    return [{ version: ctx.version, property: "Colors", file: ctx.file.name, entries }];
  },
  outputs: [{
    path: "data/colors/colors.json",
  }],
});

const planetsRoute = definePipelineRoute({
  id: "planets",
  filter: byName("planets.txt"),
  parser: standardParser,
  resolver: async (ctx, rows) => {
    ctx.logger.info("Resolving planets", { file: ctx.file.name, version: ctx.version });
    const entries: ResolvedEntry[] = [];
    for await (const row of rows) {
      if (row.value != null) entries.push({ codePoint: row.codePoint, value: row.value });
    }
    ctx.logger.debug("Planets resolved", { count: entries.length });
    return [{ version: ctx.version, property: "Planets", file: ctx.file.name, entries }];
  },
  outputs: [{
    path: "data/planets/planets.json",
  }],
});

const sizesRoute = definePipelineRoute({
  id: "sizes",
  filter: byName("sizes.txt"),
  parser: standardParser,
  resolver: async (ctx, rows) => {
    ctx.logger.info("Resolving sizes", { file: ctx.file.name, version: ctx.version });
    const entries: ResolvedEntry[] = [];
    for await (const row of rows) {
      if (row.value != null) entries.push({ codePoint: row.codePoint, value: row.value });
    }
    ctx.logger.debug("Sizes resolved", { count: entries.length });
    return [{ version: ctx.version, property: "Sizes", file: ctx.file.name, entries }];
  },
  outputs: [{
    path: "data/sizes/sizes.json",
  }],
});

export const withOutputsPipeline = definePipeline({
  id: "with-outputs",
  name: "With Outputs",
  description: "Three routes each writing to a distinct directory and static file name, so the inspect → outputs view shows a clear output entry per route.",
  versions: ["1.0.0"],
  inputs: [colorsSource, planetsSource, sizesSource],
  routes: [colorsRoute, planetsRoute, sizesRoute],
});
