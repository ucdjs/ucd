import { definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";

export const invalidSyntaxPipeline = definePipeline({
  id: "invalid-syntax",
  name: "Invalid Syntax Failing Pipeline",
  versions: ["16.0.0"],
  tags: [
    "failing",
  ],
  // This should be INVALID syntax! DO NOT EVER FIX!
  inputs: [,
  routes: [],
});
