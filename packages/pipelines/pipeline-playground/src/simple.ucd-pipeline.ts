import { always, definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";
import { createMemorySource, standardParser, propertyJsonResolver } from "@ucdjs/pipelines-presets";

export default definePipeline({
  id: "playground-simple",
  name: "Playground Simple",
  versions: ["16.0.0"],
  tags: [
    "simple"
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

