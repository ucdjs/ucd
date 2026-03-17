import { byName, definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";
import { createSortTransform } from "@ucdjs/pipelines-core/transforms";
import { propertyJsonResolver, standardParser } from "@ucdjs/pipelines-presets";
import { sharedSource } from "./shared";

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
  resolver: propertyJsonResolver,
});

const planetsRoute = definePipelineRoute({
  id: "planets",
  filter: byName("planets.txt"),
  parser: standardParser,
  resolver: async (ctx, rows) => {
    const entries = [];

    for await (const row of rows) {
      entries.push({
        codePoint: row.codePoint,
        value: (row.value ?? "Unknown Planet").toUpperCase(),
      });
    }

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
  inputs: [sharedSource],
  routes: [colorsRoute, sizesRoute, planetsRoute],
  concurrency: 3,
});
