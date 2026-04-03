import { byName, definePipeline, definePipelineRoute } from "@ucdjs/pipeline-core";
import { standardParser } from "@ucdjs/pipeline-presets";
import { groupByInitialResolver, summaryResolver } from "../shared/resolvers";
import { colorsSource, planetsSource } from "../shared/sources";

export const withCustomResolverPipeline = definePipeline({
  id: "with-custom-resolver",
  name: "With Custom Resolver",
  versions: ["1.0.0"],
  inputs: [colorsSource, planetsSource],
  routes: [
    definePipelineRoute({
      id: "colors-grouped",
      filter: byName("colors.txt"),
      parser: standardParser,
      resolver: groupByInitialResolver,
    }),
    definePipelineRoute({
      id: "planets-summary",
      filter: byName("planets.txt"),
      parser: standardParser,
      resolver: summaryResolver,
    }),
  ],
});
