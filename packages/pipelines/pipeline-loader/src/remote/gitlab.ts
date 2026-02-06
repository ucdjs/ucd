import type { RemoteFileList, RemoteRequestOptions } from "./types";

const GITLAB_API_BASE = "https://gitlab.com/api/v4";

interface GitLabTreeItem {
  path: string;
  type: string;
}

export interface GitLabRepoRef {
  owner: string;
  repo: string;
  ref?: string;
  path?: string;
}

function encodeProjectPath(owner: string, repo: string): string {
  return encodeURIComponent(`${owner}/${repo}`);
}

export async function listFiles(
  repoRef: GitLabRepoRef,
  options: RemoteRequestOptions = {},
): Promise<RemoteFileList> {
  const { owner, repo, ref, path } = repoRef;
  const refValue = ref ?? "HEAD";
  const pathValue = path ?? "";
  const { customFetch = fetch } = options;

  const projectId = encodeProjectPath(owner, repo);
  const url = `${GITLAB_API_BASE}/projects/${projectId}/repository/tree?recursive=true&ref=${refValue}&path=${encodeURIComponent(pathValue)}&per_page=100`;

  const response = await customFetch(url);

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as GitLabTreeItem[];

  const files = data
    .filter((item) => item.type === "blob")
    .map((item) => item.path);

  return {
    files,
    truncated: false,
  };
}

export async function fetchFile(
  repoRef: GitLabRepoRef,
  filePath: string,
  options: RemoteRequestOptions = {},
): Promise<string> {
  const { owner, repo, ref } = repoRef;
  const refValue = ref ?? "HEAD";
  const { customFetch = fetch } = options;

  const projectId = encodeProjectPath(owner, repo);
  const encodedPath = encodeURIComponent(filePath);
  const url = `${GITLAB_API_BASE}/projects/${projectId}/repository/files/${encodedPath}/raw?ref=${refValue}`;

  const response = await customFetch(url);

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
  }

  return response.text();
}
