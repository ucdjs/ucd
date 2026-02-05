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

export type PipelineSource = LocalSource | GitHubSource | GitLabSource;

export interface RemoteFileList {
  files: string[];
  truncated: boolean;
}

export interface FindRemotePipelineFilesOptions {
  pattern?: string;
  fetchFn?: typeof fetch;
}

export interface LoadRemotePipelinesOptions {
  throwOnError?: boolean;
  fetchFn?: typeof fetch;
  transformFn?: (code: string, filename: string) => { code: string };
}
