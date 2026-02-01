import { findPipelineFiles, loadPipelinesFromPaths } from "@ucdjs/pipelines-loader";
import { H3 } from "h3";
import { toPipelineDetails, toPipelineInfo } from "../types";

export const pipelinesRouter = new H3();

pipelinesRouter.get("/", async (event) => {
  const { cwd } = event.context;

  const files = await findPipelineFiles(["**/*.ucd-pipeline.ts"], cwd);
  const result = await loadPipelinesFromPaths(files);

  return {
    pipelines: result.pipelines.map(toPipelineInfo),
    cwd,
    errors: result.errors.map((e) => ({
      filePath: e.filePath,
      message: e.error.message,
    })),
  };
});

pipelinesRouter.get("/:id", async (event) => {
  const { cwd } = event.context;
  const id = event.context.params?.id;

  if (!id) {
    return { error: "Pipeline ID is required" };
  }

  const files = await findPipelineFiles(cwd);
  const result = await loadPipelinesFromPaths(files);

  const pipeline = result.pipelines.find((p) => p.id === id);

  if (!pipeline) {
    return { error: `Pipeline "${id}" not found` };
  }

  return {
    pipeline: toPipelineDetails(pipeline),
  };
});
