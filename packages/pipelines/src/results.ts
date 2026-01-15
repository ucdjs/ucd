import type { PipelineError, PipelineGraph } from "./events";

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
