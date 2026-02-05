import type { RemoteFileList } from "./types";

const GITHUB_API_BASE = "https://api.github.com";

export interface GitHubRepoRef {
  owner: string;
  repo: string;
  ref?: string;
  path?: string;
}

export async function listFiles(
  repoRef: GitHubRepoRef,
  options: { fetchFn?: typeof fetch } = {},
): Promise<RemoteFileList> {
  const { owner, repo, ref = "HEAD", path = "" } = repoRef;
  const { fetchFn = fetch } = options;

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
  const response = await fetchFn(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as {
    tree: Array<{ path: string; type: string }>;
    truncated: boolean;
  };

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
  options: { fetchFn?: typeof fetch } = {},
): Promise<string> {
  const { owner, repo, ref = "HEAD" } = repoRef;
  const { fetchFn = fetch } = options;

  const encodedPath = encodeURIComponent(filePath);
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${ref}`;

  const response = await fetchFn(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { content: string; encoding: string };

  if (data.encoding !== "base64") {
    throw new Error(`Unexpected encoding: ${data.encoding}`);
  }

  // eslint-disable-next-line node/prefer-global/buffer
  return Buffer.from(data.content, "base64").toString("utf-8");
}
