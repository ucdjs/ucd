import type { RemoteRequestOptions } from "../remote/types";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getRepositoryCacheDir } from "@ucdjs-internal/shared/config";
import { parseTarGzip } from "nanotar";

const GITLAB_API_BASE = "https://gitlab.com/api/v4";

interface GitLabRepoRef {
  owner: string;
  repo: string;
  ref?: string;
}

interface GitLabCommitResponse {
  id: string;
}

function encodeProjectPath(owner: string, repo: string): string {
  return encodeURIComponent(`${owner}/${repo}`);
}

/**
 * Resolve a ref (branch/tag) to a commit SHA
 */
export async function resolveGitLabRef(
  repoRef: GitLabRepoRef,
  options: RemoteRequestOptions = {},
): Promise<string> {
  const { owner, repo, ref = "HEAD" } = repoRef;
  const { customFetch = fetch } = options;

  const projectId = encodeProjectPath(owner, repo);
  const refValue = ref === "HEAD" ? "HEAD" : ref;

  const url = `${GITLAB_API_BASE}/projects/${projectId}/repository/commits/${refValue}`;
  const response = await customFetch(url);

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as GitLabCommitResponse;
  return data.id;
}

/**
 * Download and extract a GitLab repository archive
 */
export async function downloadGitLabRepo(
  repoRef: GitLabRepoRef,
  options: RemoteRequestOptions = {},
): Promise<string> {
  const { owner, repo } = repoRef;
  const { customFetch = fetch } = options;

  // First resolve the ref to a commit SHA for immutable caching
  const commitSha = await resolveGitLabRef(repoRef, options);
  const cacheDir = getRepositoryCacheDir("gitlab", owner, repo, commitSha);

  // Check if already cached
  try {
    const fs = await import("node:fs");
    if (fs.existsSync(cacheDir)) {
      return cacheDir;
    }
  } catch {
    // Continue to download
  }

  // Download the tar.gz archive
  const projectId = encodeProjectPath(owner, repo);
  const archiveUrl = `${GITLAB_API_BASE}/projects/${projectId}/repository/archive.tar.gz?sha=${commitSha}`;

  const response = await customFetch(archiveUrl);

  if (!response.ok) {
    throw new Error(`Failed to download GitLab archive: ${response.status} ${response.statusText}`);
  }

  // Create cache directory
  await mkdir(cacheDir, { recursive: true });

  // Get the archive data
  const archiveBuffer = await response.arrayBuffer();

  // Parse and extract the tar.gz
  const files = await parseTarGzip(archiveBuffer);

  // GitLab tarballs have a single root folder like "project-commitsha/"
  // We need to strip that prefix
  const rootPrefix = files[0]?.name.split("/")[0];

  if (!rootPrefix) {
    throw new Error("Invalid archive: no files found");
  }

  for (const file of files) {
    // Skip directories and files without data
    if (file.type === "directory" || !file.data) continue;

    // Strip the root prefix
    const relativePath = file.name.slice(rootPrefix.length + 1); // +1 for the slash
    if (!relativePath) continue;

    const outputPath = path.join(cacheDir, relativePath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, file.data);
  }

  return cacheDir;
}
