import type { AnyPipelineDefinition, PipelineLogLevel } from "@ucdjs/pipelines-core";
import type { PipelineError, PipelineOutputManifestEntry } from "@ucdjs/pipelines-core/tracing";
import type { CacheStore } from "./cache";
import type { PipelineExecutionRuntime } from "./runtime";

export type { PipelineLogLevel } from "@ucdjs/pipelines-core";

export interface PipelineSummary {
  versions: string[];
  totalRoutes: number;
  cached: number;
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
  outputManifest: PipelineOutputManifestEntry[];
  errors: PipelineError[];
  summary: PipelineSummary;
  status: ExecutionStatus;
}

export type PipelineLogSource = "logger" | "console" | "stdio";

export interface PipelineLogEntry {
  executionId: string;
  workspaceId: string;
  spanId?: string;
  traceKind?: string;
  level: PipelineLogLevel;
  source: PipelineLogSource;
  message: string;
  timestamp: number;
  args?: unknown[];
  meta?: Record<string, unknown>;
}

export interface PipelineExecutorOptions {
  cacheStore?: CacheStore;
  onLog?: (entry: PipelineLogEntry) => void | Promise<void>;
  runtime?: PipelineExecutionRuntime;
}

export interface PipelineExecutorRunOptions {
  cache?: boolean;
  versions?: string[];
}

export interface PipelineExecutor {
  run: (pipelines: AnyPipelineDefinition[], options?: PipelineExecutorRunOptions) => Promise<PipelineExecutionResult[]>;
}
