import type { ParsedRow } from "@ucdjs/pipelines-core";
import { byName, definePipeline, definePipelineRoute, definePipelineTransform } from "@ucdjs/pipelines-core";
import { createDeduplicateTransform, createSortTransform } from "@ucdjs/pipelines-core/transforms";
import { propertyJsonResolver, standardParser } from "@ucdjs/pipelines-presets";
import { colorsSource, sizesSource } from "../shared.sources";

/**
 * Custom transform that uppercases every value.
 */
const uppercaseValues = definePipelineTransform<ParsedRow, ParsedRow>({
  id: "uppercase-values",
  async* fn(_ctx, rows) {
    for await (const row of rows) {
      yield {
        ...row,
        value: typeof row.value === "string" ? row.value.toUpperCase() : row.value,
      };
    }
  },
});

export const withTransformsPipeline = definePipeline({
  id: "with-transforms",
  name: "With Transforms",
  versions: ["1.0.0"],
  inputs: [colorsSource, sizesSource],
  routes: [
    definePipelineRoute({
      id: "colors-sorted",
      filter: byName("colors.txt"),
      parser: standardParser,
      transforms: [
        createSortTransform({ direction: "desc" }),
        uppercaseValues,
      ],
      resolver: propertyJsonResolver,
    }),
    definePipelineRoute({
      id: "sizes-deduped",
      filter: byName("sizes.txt"),
      parser: standardParser,
      transforms: [
        createDeduplicateTransform({ strategy: "first" }),
        createSortTransform({ direction: "asc" }),
      ],
      resolver: propertyJsonResolver,
    }),
  ],
});
