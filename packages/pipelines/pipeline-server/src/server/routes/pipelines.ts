import fs from "node:fs";
import path from "node:path";
import { findPipelineFiles, loadPipelinesFromPaths } from "@ucdjs/pipelines-loader";
import { getQuery, H3 } from "h3";
import { extractDefinePipelineCode } from "../code";
import { toPipelineDetails, toPipelineInfo } from "../types";

export const pipelinesRouter = new H3();

pipelinesRouter.get("/", async (event) => {
  const { cwd } = event.context;

  const files = await findPipelineFiles({
    cwd,
  });
  const result = await loadPipelinesFromPaths(files);
  const query = getQuery(event).query;
  const search = typeof query === "string" ? query.trim().toLowerCase() : "";

  const pipelines = search
    ? result.pipelines.filter((pipeline) => {
        const haystack = [
          pipeline.id,
          pipeline.name ?? "",
          pipeline.description ?? "",
          ...pipeline.versions,
          ...pipeline.routes.map((route) => route.id),
          ...pipeline.inputs.map((input) => input.id),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(search);
      })
    : result.pipelines;

  return {
    pipelines: pipelines.map(toPipelineInfo),
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

  const files = await findPipelineFiles({
    cwd,
  });
  const result = await loadPipelinesFromPaths(files);

  const pipeline = result.pipelines.find((p) => p.id === id);

  if (!pipeline) {
    return { error: `Pipeline "${id}" not found` };
  }

  return {
    pipeline: toPipelineDetails(pipeline),
  };
});

pipelinesRouter.get("/:id/code", async (event) => {
  const { cwd } = event.context;
  const id = event.context.params?.id;

  if (!id) {
    return { error: "Pipeline ID is required" };
  }

  const files = await findPipelineFiles({
    cwd,
  });
  const result = await loadPipelinesFromPaths(files);

  const pipeline = result.pipelines.find((p) => p.id === id);

  if (!pipeline) {
    return { error: `Pipeline "${id}" not found` };
  }

  const file = result.files.find((f) => f.pipelines.some((p) => p.id === id));

  if (!file) {
    return { error: `Pipeline file for "${id}" not found` };
  }

  const exportIndex = file.pipelines.findIndex((p) => p.id === id);
  const exportName = file.exportNames[exportIndex] ?? "default";
  const filePath = path.resolve(cwd, file.filePath);
  const source = await fs.promises.readFile(filePath, "utf-8");

  return {
    code: extractDefinePipelineCode(source, { exportName }),
    filePath: file.filePath,
  };
});
