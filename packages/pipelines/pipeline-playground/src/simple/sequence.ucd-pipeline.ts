import { byName, definePipeline, definePipelineRoute } from "@ucdjs/pipeline-core";
import { propertyJsonResolver, sequenceParser } from "@ucdjs/pipeline-presets";
import { sequencesSource } from "../shared/sources";

export const sequencePipeline = definePipeline({
  id: "playground-sequence",
  name: "Playground Sequence",
  versions: ["1.0.0"],
  inputs: [sequencesSource],
  routes: [
    definePipelineRoute({
      id: "sequence-route",
      filter: byName("sequences.txt"),
      parser: sequenceParser,
      resolver: propertyJsonResolver,
    }),
  ],
});
