import type { LoadPipelinesResult, PipelineSource } from "@ucdjs/pipelines-loader";
import path from "node:path";
import {
  findPipelineFiles,
  findRemotePipelineFiles,
  loadPipelinesFromPaths,
  loadRemotePipelines,
} from "@ucdjs/pipelines-loader";

export async function getPipelines(source: PipelineSource): Promise<LoadPipelinesResult> {
  if (source.type === "local") {
    const files = await findPipelineFiles({ cwd: source.cwd });
    const result = await loadPipelinesFromPaths(files);
    const normalize = (filePath: string) =>
      path.relative(source.cwd, filePath).replace(/\\/g, "/");

    return {
      ...result,
      files: result.files.map((file) => ({
        ...file,
        filePath: normalize(file.filePath),
      })),
      errors: result.errors.map((error) => ({
        ...error,
        filePath: normalize(error.filePath),
      })),
    };
  }

  const fileList = await findRemotePipelineFiles(source);
  return loadRemotePipelines(source, fileList.files);
}
