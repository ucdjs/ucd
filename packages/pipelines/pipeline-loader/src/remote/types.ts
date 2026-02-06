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

export interface RemoteRequestOptions {
  customFetch?: typeof fetch;
}
