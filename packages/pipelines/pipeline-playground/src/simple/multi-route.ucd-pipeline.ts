import type { ResolvedEntry } from "@ucdjs/pipelines-core";
import { byName, definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";
import { createSortTransform } from "@ucdjs/pipelines-core/transforms";
import { propertyJsonResolver, standardParser } from "@ucdjs/pipelines-presets";
import { colorsSource, planetsSource, sizesSource } from "../shared.sources";

const colorsRoute = definePipelineRoute({
  id: "colors",
  filter: byName("colors.txt"),
  parser: standardParser,
  resolver: propertyJsonResolver,
});

const sizesRoute = definePipelineRoute({
  id: "sizes",
  filter: byName("sizes.txt"),
  parser: standardParser,
  transforms: [
    createSortTransform({ direction: "asc" }),
  ],
  resolver: async (ctx, rows) => {
    ctx.logger.info("Resolving sizes (sorted asc)", { version: ctx.version });
    const entries: ResolvedEntry[] = [];
    for await (const row of rows) {
      if (row.value != null) entries.push({ codePoint: row.codePoint, value: row.value });
    }
    ctx.logger.debug("Sizes resolved", { count: entries.length });
    return [{ version: ctx.version, property: "Sizes", file: ctx.file.name, entries }];
  },
});

const planetsRoute = definePipelineRoute({
  id: "planets",
  filter: byName("planets.txt"),
  parser: standardParser,
  resolver: async (ctx, rows) => {
    ctx.logger.info("Resolving planets (uppercased)", { version: ctx.version });
    const entries: ResolvedEntry[] = [];

    for await (const row of rows) {
      const value = Array.isArray(row.value)
        ? row.value.join(", ")
        : (row.value ?? "Unknown Planet");

      entries.push({
        codePoint: row.codePoint,
        value: value.toUpperCase(),
      });
    }

    ctx.logger.debug("Planets resolved", { count: entries.length });
    return [{
      version: ctx.version,
      property: "Planets",
      file: ctx.file.name,
      entries,
    }];
  },
});

export const multiRoutePipeline = definePipeline({
  id: "multi-route",
  name: "Multi Route",
  versions: ["1.0.0"],
  inputs: [colorsSource, sizesSource, planetsSource],
  routes: [colorsRoute, sizesRoute, planetsRoute],
  concurrency: 3,
});
