import type { PipelineDefinition } from "@ucdjs/pipelines-core";

export interface LoadedPipelineFile {
  filePath: string;
  sourceFilePath?: string;
  pipelines: PipelineDefinition[];
  exportNames: string[];
}

export interface LoadPipelinesResult {
  pipelines: PipelineDefinition[];
  files: LoadedPipelineFile[];
  errors: PipelineLoadError[];
}

export const PIPELINE_LOAD_ERROR_CODES = [
  "DISCOVERY_FAILED",
  "CACHE_MISS",
  "SYNC_FAILED",
  "BUNDLE_FAILED",
  "BUNDLE_RESOLVE_FAILED",
  "BUNDLE_TRANSFORM_FAILED",
  "IMPORT_FAILED",
  "INVALID_EXPORT",
  "UNKNOWN",
] as const;

export type PipelineLoadErrorCode = (typeof PIPELINE_LOAD_ERROR_CODES)[number];
export type PipelineLoadErrorScope = "file" | "source";

export interface PipelineLoadError {
  code: PipelineLoadErrorCode;
  scope: PipelineLoadErrorScope;
  message: string;
  filePath?: string;
  cause?: Error;
  meta?: Record<string, unknown>;
}

export interface FindPipelineFilesResult {
  files: string[];
  errors: PipelineLoadError[];
}

export interface SourceRepositoryRef {
  owner: string;
  repo: string;
  ref?: string;
}

export type SourceRepositoryRefWithCommitSha = SourceRepositoryRef & { commitSha: string };
export type SourceRepositoryRefWithSourceType = SourceRepositoryRef & { source: RemotePipelineSource["type"] };

export interface GitHubSource extends SourceRepositoryRef {
  type: "github";
  id: string;
  path?: string;
}

export interface GitLabSource extends SourceRepositoryRef {
  type: "gitlab";
  id: string;
  path?: string;
}

export interface LocalSource {
  type: "local";
  id: string;
  cwd: string;
}

export type PipelineSource = LocalSource | GitHubSource | GitLabSource;
export type RemotePipelineSource = GitHubSource | GitLabSource;
export type PipelineSourceWithoutId = Omit<LocalSource, "id"> | Omit<GitHubSource, "id"> | Omit<GitLabSource, "id">;
