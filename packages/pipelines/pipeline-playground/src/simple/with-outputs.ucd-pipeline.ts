import { byName, definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";
import { propertyJsonResolver, standardParser } from "@ucdjs/pipelines-presets";
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
  resolver: propertyJsonResolver,
  outputs: [{
    dir: "data/colors",
    fileName: () => "colors.json",
  }],
});

const planetsRoute = definePipelineRoute({
  id: "planets",
  filter: byName("planets.txt"),
  parser: standardParser,
  resolver: propertyJsonResolver,
  outputs: [{
    dir: "data/planets",
    fileName: () => "planets.json",
  }],
});

const sizesRoute = definePipelineRoute({
  id: "sizes",
  filter: byName("sizes.txt"),
  parser: standardParser,
  resolver: propertyJsonResolver,
  outputs: [{
    dir: "data/sizes",
    fileName: () => "sizes.json",
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
