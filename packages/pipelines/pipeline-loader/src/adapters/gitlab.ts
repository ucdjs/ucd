import type { SourceRepositoryRef, SourceRepositoryRefWithCommitSha } from "../types";

const GITLAB_API_BASE = "https://gitlab.com/api/v4";

export async function resolveGitLabRef(ref: SourceRepositoryRef): Promise<string> {
  const { owner, repo, ref: refValue = "HEAD" } = ref;

  const url = `${GITLAB_API_BASE}/projects/${encodeURIComponent(`${owner}/${repo}`)}/repository/commits/${refValue}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as unknown;
  if (!data || typeof data !== "object" || !("id" in data) || typeof data.id !== "string") {
    throw new Error("GitLab API error: invalid response format (missing 'id')");
  }
  return data.id;
}

export async function downloadGitLabArchive(ref: SourceRepositoryRefWithCommitSha): Promise<ArrayBuffer> {
  const { owner, repo, commitSha } = ref;
  const archiveUrl = `${GITLAB_API_BASE}/projects/${encodeURIComponent(`${owner}/${repo}`)}/repository/archive.tar.gz?sha=${commitSha}`;
  const response = await fetch(archiveUrl, {
    mode: "same-origin",
  });

  if (!response.ok) {
    throw new Error(`Failed to download GitLab archive: ${response.status} ${response.statusText}`);
  }

  return response.arrayBuffer();
}
