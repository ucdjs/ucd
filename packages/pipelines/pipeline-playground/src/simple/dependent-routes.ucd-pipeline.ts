import { byName, definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";
import { propertyJsonResolver, standardParser } from "@ucdjs/pipelines-presets";
import { colorsSource, sizesSource } from "../shared/sources";

/**
 * Route A: processes colors first - no dependencies.
 */
const colorsRoute = definePipelineRoute({
  id: "colors",
  filter: byName("colors.txt"),
  parser: standardParser,
  resolver: propertyJsonResolver,
});

/**
 * Route B: processes sizes but must wait for the colors route to finish first.
 * Uses `getRouteData` to access output from the colors route.
 */
const sizesAfterColorsRoute = definePipelineRoute({
  id: "sizes-after-colors",
  filter: byName("sizes.txt"),
  depends: ["route:colors"],
  parser: standardParser,
  resolver: async (ctx, rows) => {
    const colorData = ctx.getRouteData("colors");
    const entries = [];

    for await (const row of rows) {
      entries.push({
        codePoint: row.codePoint,
        value: row.value ?? "",
      });
    }

    return [{
      version: ctx.version,
      property: "Sizes",
      file: ctx.file.name,
      entries,
      meta: {
        note: "Processed after colors route completed",
        colorOutputCount: colorData.length,
      },
    }];
  },
});

export const dependentRoutesPipeline = definePipeline({
  id: "dependent-routes",
  name: "Dependent Routes",
  versions: ["1.0.0"],
  inputs: [colorsSource, sizesSource],
  routes: [colorsRoute, sizesAfterColorsRoute],
});
