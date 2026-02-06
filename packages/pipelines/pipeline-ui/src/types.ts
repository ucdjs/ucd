import type { PipelineEvent, PipelineGraph } from "@ucdjs/pipelines-core";

export interface PipelineInfo {
  id: string;
  name?: string;
  description?: string;
  versions: string[];
  routeCount: number;
  sourceCount: number;
  sourceId: string;
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
  pipelines: PipelineInfo[];
  cwd: string;
  errors: LoadError[];
}

export interface PipelineResponse {
  pipeline?: PipelineDetails;
  error?: string;
}

export interface ExecuteResult {
  success: boolean;
  pipelineId: string;
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
