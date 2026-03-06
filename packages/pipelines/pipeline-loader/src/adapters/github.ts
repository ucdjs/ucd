import type { SourceRepositoryRef, SourceRepositoryRefWithCommitSha } from "../types";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_ACCEPT_HEADER = "application/vnd.github.v3+json";

export async function resolveGitHubRef(ref: SourceRepositoryRef): Promise<string> {
  const { owner, repo, ref: refValue = "HEAD" } = ref;

  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${refValue}`, {
    headers: {
      Accept: GITHUB_ACCEPT_HEADER,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as unknown;
  if (!data || typeof data !== "object" || !("sha" in data) || typeof data.sha !== "string") {
    throw new Error("GitHub API error: invalid response format (missing 'sha')");
  }

  return data.sha;
}

export async function downloadGitHubArchive(ref: SourceRepositoryRefWithCommitSha): Promise<ArrayBuffer> {
  const { owner, repo, commitSha } = ref;
  const archiveUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/tarball/${commitSha}`;
  const response = await fetch(archiveUrl, {
    headers: {
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download GitHub archive: ${response.status} ${response.statusText}`);
  }

  return response.arrayBuffer();
}
