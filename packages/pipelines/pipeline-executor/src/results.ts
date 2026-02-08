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

export type ExecutionStatus = "running" | "completed" | "failed";

export interface PipelineExecutionResult {
  id: string;
  data: unknown[];
  graph: PipelineGraph;
  errors: PipelineError[];
  summary: PipelineSummary;
  status: ExecutionStatus;
}
