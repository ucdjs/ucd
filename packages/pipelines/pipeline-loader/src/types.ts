import type { PipelineDefinition } from "@ucdjs/pipelines-core";

export interface LoadedPipelineFile {
  filePath: string;
  pipelines: PipelineDefinition[];
  exportNames: string[];
}

export interface LoadPipelinesResult {
  pipelines: PipelineDefinition[];
  files: LoadedPipelineFile[];
  errors: PipelineLoadError[];
}

export interface PipelineLoadError {
  filePath: string;
  error: Error;
}

export interface GitHubSource {
  type: "github";
  id: string;
  owner: string;
  repo: string;
  ref?: string;
  path?: string;
}

export interface GitLabSource {
  type: "gitlab";
  id: string;
  owner: string;
  repo: string;
  ref?: string;
  path?: string;
}

export interface LocalSource {
  type: "local";
  id: string;
  cwd: string;
}

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export interface RemoteMaterializeOptions {
  workdir?: string;
}

export interface RemoteInstallOptions {
  enabled?: boolean;
  packageManager?: PackageManager | "auto";
  allowScripts?: boolean;
}

export type PipelineSource = LocalSource | GitHubSource | GitLabSource;
