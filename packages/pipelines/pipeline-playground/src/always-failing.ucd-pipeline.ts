import { definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";

export const alwaysFailingPipeline = definePipeline({
  id: "always-failing",
  name: "Always Failing Pipeline",
  versions: ["16.0.0"],
  tags: [
    "failing",
  ],
  inputs: [],
  routes: [
    definePipelineRoute({
      id: "always-failing-route",
      filter: () => true,
      async* parser() {
        throw new Error("This route always fails");
      },
      resolver() {
        throw new Error("This route always fails");
      },
    }),
  ],
});
