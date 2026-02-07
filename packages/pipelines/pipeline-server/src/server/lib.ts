import type { LoadPipelinesResult, PipelineSource } from "@ucdjs/pipelines-loader";
import { findPipelineFiles, findRemotePipelineFiles, loadPipelinesFromPaths, loadRemotePipelines } from "@ucdjs/pipelines-loader";

export async function getPipelines(source: PipelineSource): Promise<LoadPipelinesResult> {
  if (source.type === "local") {
    const files = await findPipelineFiles({ cwd: source.cwd });
    return loadPipelinesFromPaths(files);
  }

  const fileList = await findRemotePipelineFiles(source);
  return loadRemotePipelines(source, fileList.files);
}
