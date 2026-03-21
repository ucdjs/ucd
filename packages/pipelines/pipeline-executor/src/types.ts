import type { AnyPipelineDefinition, PipelineError, PipelineEvent, PipelineGraph, PipelineLogLevel } from "@ucdjs/pipelines-core";
import type { CacheStore } from "./cache";
import type { PipelineOutputManifestEntry, PipelineTraceRecord } from "./run/traces";
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
  traces: PipelineTraceRecord[];
  graph: PipelineGraph;
  errors: PipelineError[];
  summary: PipelineSummary;
  status: ExecutionStatus;
}

export type PipelineLogSource = "logger" | "console" | "stdio";

export interface PipelineLogEntry {
  executionId: string;
  workspaceId: string;
  spanId?: string;
  event?: PipelineEvent;
  level: PipelineLogLevel;
  source: PipelineLogSource;
  message: string;
  timestamp: number;
  args?: unknown[];
  meta?: Record<string, unknown>;
}

export interface PipelineExecutorOptions {
  cacheStore?: CacheStore;
  onEvent?: (event: PipelineEvent) => void | Promise<void>;
  onLog?: (entry: PipelineLogEntry) => void | Promise<void>;
  onTrace?: (trace: PipelineTraceRecord) => void | Promise<void>;
  runtime?: PipelineExecutionRuntime;
}

export interface PipelineExecutorRunOptions {
  cache?: boolean;
  versions?: string[];
}

export interface PipelineExecutor {
  run: (pipelines: AnyPipelineDefinition[], options?: PipelineExecutorRunOptions) => Promise<PipelineExecutionResult[]>;
}
