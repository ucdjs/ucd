import type { PipelineDefinition } from "@ucdjs/pipelines-core";

export interface LoadedPipelineFile {
  filePath: string;
  pipelines: PipelineDefinition[];
  exportNames: string[];
}

export interface LoadPipelinesResult {
  pipelines: PipelineDefinition[];
  files: LoadedPipelineFile[];
  errors: PipelineLoadError[];
}

export interface PipelineLoadError {
  filePath: string;
  error: Error;
}
