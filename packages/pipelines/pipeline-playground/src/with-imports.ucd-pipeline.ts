import { definePipeline } from "@ucdjs/pipelines-core";
import { firstPipeline, secondPipeline } from "./multiple.ucd-pipeline";

export const mainPipeline = definePipeline({
  id: "main-pipeline",
  name: "Main Pipeline",
  versions: ["16.0.0"],
  inputs: [],
  routes: [],
})

export { firstPipeline, secondPipeline };
