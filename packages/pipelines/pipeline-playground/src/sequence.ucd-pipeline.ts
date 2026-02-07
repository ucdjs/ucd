import { byName, definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";
import { createMemorySource, sequenceParser, propertyJsonResolver } from "@ucdjs/pipelines-presets";

export const sequencePipeline = definePipeline({
  id: "playground-sequence",
  name: "Playground Sequence",
  versions: ["16.0.0"],
  inputs: [
    createMemorySource({
      files: {
        "16.0.0": [
          {
            path: "ucd/Sequences.txt",
            content: "0041 0308; A_DIAERESIS\n006F 0308; O_DIAERESIS\n",
          },
        ],
      },
    }),
  ],
  routes: [
    definePipelineRoute({
      id: "sequence-route",
      filter: byName("Sequences.txt"),
      parser: sequenceParser,
      resolver: propertyJsonResolver,
    }),
  ],
});
