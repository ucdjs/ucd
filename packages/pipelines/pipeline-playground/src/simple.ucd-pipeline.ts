import { always, definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";
import { createMemorySource } from "@ucdjs/pipelines-core/sources";
import { propertyJsonResolver, standardParser } from "@ucdjs/pipelines-presets";

export const simplePipeline = definePipeline({
  id: "simple",
  name: "Playground Simple",
  versions: ["16.0.0"],
  tags: [
    "simple",
  ],
  inputs: [
    createMemorySource({
      files: {
        "16.0.0": [
          {
            path: "ucd/Hello.txt",
            content: "0048; H\n0065; e\n006C; l\n006C; l\n006F; o\n",
          },
        ],
      },
    }),
  ],
  routes: [
    definePipelineRoute({
      id: "hello",
      filter: always(),
      parser: standardParser,
      resolver: propertyJsonResolver,
    }),
  ],
});
