import type { RemoteFileList, RemoteRequestOptions } from "./types";
import { RemoteNotFoundError } from "./utils";

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

/**
 * List repository files from GitLab, following pagination when present.
 */
export async function listFiles(
  repoRef: GitLabRepoRef,
  options: RemoteRequestOptions = {},
): Promise<RemoteFileList> {
  const { owner, repo, ref, path } = repoRef;
  const refValue = ref ?? "HEAD";
  const pathValue = path ?? "";
  const { customFetch = fetch } = options;

  const projectId = encodeProjectPath(owner, repo);
  const encodedPath = encodeURIComponent(pathValue);
  const files: string[] = [];
  let page = 1;
  let truncated = false;

  while (true) {
    const url = `${GITLAB_API_BASE}/projects/${projectId}/repository/tree?recursive=true&ref=${refValue}&path=${encodedPath}&per_page=100&page=${page}`;
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as GitLabTreeItem[];
    files.push(
      ...data
        .filter((item) => item.type === "blob")
        .map((item) => item.path),
    );

    const nextPage = response.headers.get("x-next-page");
    if (!nextPage) {
      break;
    }

    const nextPageNumber = Number(nextPage);
    if (!Number.isFinite(nextPageNumber) || nextPageNumber <= page) {
      truncated = true;
      break;
    }

    page = nextPageNumber;
  }

  return {
    files,
    truncated,
  };
}

/**
 * Fetch a repository file from GitLab as raw text.
 */
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
    if (response.status === 404) {
      throw new RemoteNotFoundError(`GitLab file not found: ${filePath}`);
    }
    throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
  }

  return response.text();
}
