import type { PipelineEvent, PipelineGraph } from "@ucdjs/pipelines-core";
import type { ExecutionStatus } from "@ucdjs/pipelines-executor";

export interface PipelineInfo {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  versions: string[];
  routeCount: number;
  sourceCount: number;
  sourceId: string;
}

export interface PipelineFileInfo {
  fileId: string;
  filePath: string;
  fileLabel?: string;
  sourceId: string;
  pipelines: PipelineInfo[];
}

export interface PipelineDetails {
  id: string;
  name?: string;
  description?: string;
  versions: string[];
  routeCount: number;
  sourceCount: number;
  routes: Array<{
    id: string;
    cache: boolean;
    depends: Array<
      | { type: "route"; routeId: string }
      | { type: "artifact"; routeId: string; artifactName: string }
    >;
    emits: Array<{ id: string; scope: "version" | "global" }>;
    outputs: Array<{ dir?: string; fileName?: string }>;
    transforms: string[];
  }>;
  sources: Array<{ id: string }>;
}

export interface LoadError {
  filePath: string;
  message: string;
  sourceId?: string;
}

export interface PipelinesResponse {
  files: PipelineFileInfo[];
  errors: LoadError[];
}

export interface PipelineResponse {
  pipeline?: PipelineDetails;
  error?: string;
  fileId?: string;
  filePath?: string;
  fileLabel?: string;
  sourceId?: string;
}

export interface ExecuteResult {
  success: boolean;
  pipelineId: string;
  executionId?: string;
  summary?: {
    versions: string[];
    totalFiles: number;
    matchedFiles: number;
    skippedFiles: number;
    fallbackFiles: number;
    totalOutputs: number;
    durationMs: number;
  };
  graph?: PipelineGraph;
  events?: PipelineEvent[];
  errors?: Array<{ scope: string; message: string }>;
  error?: string;
}

export type ExecutionLogStream = "stdout" | "stderr";

export interface ExecutionLogPayload {
  message: string;
  stream: ExecutionLogStream;
  args?: unknown[];
  truncated?: boolean;
  originalSize?: number;
  event?: PipelineEvent;
}

export interface ExecutionLogItem {
  id: string;
  spanId: string | null;
  stream: ExecutionLogStream;
  message: string;
  timestamp: string;
  payload: ExecutionLogPayload | null;
}

export interface ExecutionLogsResponse {
  executionId: string;
  pipelineId: string;
  status: ExecutionStatus;
  logs: ExecutionLogItem[];
  truncated: boolean;
  capturedSize: number;
  originalSize: number | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ExecutionEventItem {
  id: string;
  type: string;
  timestamp: string;
  data: PipelineEvent;
}

export interface ExecutionEventsResponse {
  executionId: string;
  pipelineId: string;
  status: ExecutionStatus;
  events: ExecutionEventItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
