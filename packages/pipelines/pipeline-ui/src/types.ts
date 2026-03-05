import type { PipelineEvent, PipelineGraph } from "@ucdjs/pipelines-core";
import type { Execution } from "./schemas/execution";
import type { PipelineInfo } from "./schemas/pipeline";
import type { PipelineLoadError } from "./schemas/source";

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

export interface PipelinesResponse {
  workspaceId: string;
  files: PipelineFileInfo[];
  errors: PipelineLoadError[];
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

export interface ExecutionEventItem {
  id: string;
  type: string;
  timestamp: string;
  data: PipelineEvent;
}

export type ExecutionInfo = Pick<Execution, "id" | "pipelineId" | "status" | "startedAt"> & {
  pipelineName: string;
  sourceId: string;
  fileId: string;
};
