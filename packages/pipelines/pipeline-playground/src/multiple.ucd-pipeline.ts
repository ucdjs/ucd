import { definePipeline } from "@ucdjs/pipelines-core";

export const firstPipeline = definePipeline({
  id: "first-pipeline",
  name: "First Pipeline",
  versions: ["16.0.0"],
  inputs: [],
  routes: [],
});

export const secondPipeline = definePipeline({
  id: "second-pipeline",
  name: "Second Pipeline",
  versions: ["16.0.0"],
  inputs: [],
  routes: [],
});
