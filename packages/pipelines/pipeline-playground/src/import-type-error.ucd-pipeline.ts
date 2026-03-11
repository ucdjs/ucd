import { definePipeline } from "@ucdjs/pipelines-core";

const pipeline = definePipeline({
  id: "import-type-error",
  name: "Import TypeError Pipeline",
  versions: ["16.0.0"],
  tags: [
    "failing",
    "import",
  ],
  inputs: [],
  routes: [],
});

const trigger = null as unknown as { crash: () => never };
trigger.crash();

export const importTypeErrorPipeline = pipeline;
