import { definePipeline } from "@ucdjs/pipeline-core";

const pipeline = definePipeline({
  id: "import-throws",
  name: "Import Throws Pipeline",
  versions: ["16.0.0"],
  tags: [
    "failing",
    "import",
  ],
  inputs: [],
  routes: [],
});

throw new Error("Playground import failure triggered during module evaluation");

export const importThrowsPipeline = pipeline;
