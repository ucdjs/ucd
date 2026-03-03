import type { PipelineArtifactDefinition } from "@ucdjs/pipelines-artifacts";
import type { AnyPipelineDefinition, PipelineError, PipelineEvent, PipelineGraph } from "@ucdjs/pipelines-core";
import type { CacheStore } from "./cache";

export interface PipelineSummary {
  versions: string[];
  totalFiles: number;
  matchedFiles: number;
  skippedFiles: number;
  fallbackFiles: number;
  totalOutputs: number;
  durationMs: number;
}

export const EXECUTION_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;

export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

export interface PipelineExecutionResult {
  id: string;
  data: unknown[];
  graph: PipelineGraph;
  errors: PipelineError[];
  summary: PipelineSummary;
  status: ExecutionStatus;
}

export interface PipelineExecutorOptions {
  artifacts?: PipelineArtifactDefinition[];
  cacheStore?: CacheStore;
  onEvent?: (event: PipelineEvent) => void | Promise<void>;
}

export interface PipelineExecutorRunOptions {
  cache?: boolean;
  versions?: string[];
}

export interface PipelineExecutor {
  run: (pipelines: AnyPipelineDefinition[], options?: PipelineExecutorRunOptions) => Promise<PipelineExecutionResult[]>;
}
