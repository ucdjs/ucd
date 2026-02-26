import type { RemoteRequestOptions } from "../types";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getRepositoryCacheDir } from "@ucdjs-internal/shared/config";
import { parseTarGzip } from "nanotar";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_ACCEPT_HEADER = "application/vnd.github.v3+json";

interface GitHubRepoRef {
  owner: string;
  repo: string;
  ref?: string;
}

interface GitHubCommitResponse {
  sha: string;
}

/**
 * Resolve a ref (branch/tag) to a commit SHA
 */
export async function resolveGitHubRef(
  repoRef: GitHubRepoRef,
  options: RemoteRequestOptions = {},
): Promise<string> {
  const { owner, repo, ref = "HEAD" } = repoRef;
  const { customFetch = fetch } = options;

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${ref}`;
  const response = await customFetch(url, {
    headers: {
      Accept: GITHUB_ACCEPT_HEADER,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as GitHubCommitResponse;
  return data.sha;
}

/**
 * Download and extract a GitHub repository archive
 */
export async function downloadGitHubRepo(
  repoRef: GitHubRepoRef,
  options: RemoteRequestOptions = {},
): Promise<string> {
  const { owner, repo } = repoRef;
  const { customFetch = fetch } = options;

  // First resolve the ref to a commit SHA for immutable caching
  const commitSha = await resolveGitHubRef(repoRef, options);
  const cacheDir = getRepositoryCacheDir("github", owner, repo, commitSha);

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
  const archiveUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/tarball/${commitSha}`;
  const response = await customFetch(archiveUrl, {
    headers: {
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download GitHub archive: ${response.status} ${response.statusText}`);
  }

  // Create cache directory
  await mkdir(cacheDir, { recursive: true });

  // Get the archive data
  const archiveBuffer = await response.arrayBuffer();

  // Parse and extract the tar.gz
  const files = await parseTarGzip(archiveBuffer);

  // GitHub tarballs have a single root folder like "owner-repo-commitsha/"
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
