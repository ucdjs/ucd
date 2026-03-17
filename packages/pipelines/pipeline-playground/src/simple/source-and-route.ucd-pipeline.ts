import { byName, definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";
import { propertyJsonResolver, standardParser } from "@ucdjs/pipelines-presets";
import { sharedSource } from "./shared";

const colorsRoute = definePipelineRoute({
  id: "colors",
  filter: byName("colors.txt"),
  parser: standardParser,
  resolver: propertyJsonResolver,
});

export const sourceAndRoutePipeline = definePipeline({
  id: "source-and-route",
  name: "Source and Route",
  versions: ["1.0.0"],
  inputs: [sharedSource],
  routes: [colorsRoute],
});
