import type { PipelineError, PipelineGraph } from "@ucdjs/pipelines-core";

export interface PipelineSummary {
  versions: string[];
  totalFiles: number;
  matchedFiles: number;
  skippedFiles: number;
  fallbackFiles: number;
  totalOutputs: number;
  durationMs: number;
}

export interface PipelineRunResult<TData = unknown> {
  data: TData[];
  graph: PipelineGraph;
  errors: PipelineError[];
  summary: PipelineSummary;
}

export interface MultiplePipelineRunResult<TData = unknown> {
  results: Map<string, PipelineRunResult<TData>>;
  summary: {
    totalPipelines: number;
    successfulPipelines: number;
    failedPipelines: number;
    durationMs: number;
  };
}
