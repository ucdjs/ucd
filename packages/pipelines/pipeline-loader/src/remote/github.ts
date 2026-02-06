import type { RemoteFileList, RemoteRequestOptions } from "./types";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_ACCEPT_HEADER = "application/vnd.github.v3+json";

interface GitHubTreeItem {
  path: string;
  type: string;
}

interface GitHubTreeResponse {
  tree: GitHubTreeItem[];
  truncated: boolean;
}

interface GitHubContentResponse {
  content: string;
  encoding: string;
}

interface GitHubRepoRef {
  owner: string;
  repo: string;
  ref?: string;
  path?: string;
}

export async function listFiles(
  repoRef: GitHubRepoRef,
  options: RemoteRequestOptions = {},
): Promise<RemoteFileList> {
  const { owner, repo, ref = "HEAD", path = "" } = repoRef;
  const { customFetch = fetch } = options;

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
  const response = await customFetch(url, {
    headers: {
      Accept: GITHUB_ACCEPT_HEADER,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as GitHubTreeResponse;

  const prefix = path ? `${path}/` : "";
  const files = data.tree
    .filter((item) => item.type === "blob" && item.path.startsWith(prefix))
    .map((item) => item.path);

  return {
    files,
    truncated: data.truncated,
  };
}

export async function fetchFile(
  repoRef: GitHubRepoRef,
  filePath: string,
  options: RemoteRequestOptions = {},
): Promise<string> {
  const { owner, repo, ref = "HEAD" } = repoRef;
  const { customFetch = fetch } = options;

  const encodedPath = encodeURIComponent(filePath);
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${ref}`;

  const response = await customFetch(url, {
    headers: {
      Accept: GITHUB_ACCEPT_HEADER,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as GitHubContentResponse;

  if (data.encoding !== "base64") {
    throw new Error(`Unexpected encoding: ${data.encoding}`);
  }

  // eslint-disable-next-line node/prefer-global/buffer
  return Buffer.from(data.content, "base64").toString("utf-8");
}
