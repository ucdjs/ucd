import type { RemotePipelineSource, SourceRepositoryRef, SourceRepositoryRefWithCommitSha } from "./types";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseTarGzip } from "nanotar";
import { downloadGitHubArchive, resolveGitHubRef } from "./adapters/github";
import { downloadGitLabArchive, resolveGitLabRef } from "./adapters/gitlab";

export interface RemoteSourceResult {
  type: "github" | "gitlab";
  owner: string;
  repo: string;
  ref: string;
  filePath: string;
}

/**
 * Parse remote source URLs
 * @param {string} url - The remote source URL to parse, which can be in the format of "github://owner/repo?ref=branch&path=subdir" or "gitlab://owner/repo?ref=branch&path=subdir".
 * @returns {RemoteSourceResult | null} An object containing the parsed type (github or gitlab), owner, repo, ref, and filePath if the URL is valid, or null if the URL is invalid.
 */
export function parseRemoteSourceUrl(url: string): RemoteSourceResult | null {
  if (url.startsWith("github://")) {
    const match = url.match(/^github:\/\/([^/]+)\/([^?]+)\?ref=([^&]+)&path=(.+)$/);
    if (match && match[1] && match[2] && match[3] && match[4]) {
      return {
        type: "github",
        owner: match[1],
        repo: match[2],
        ref: match[3],
        filePath: match[4],
      };
    }
  }

  if (url.startsWith("gitlab://")) {
    const match = url.match(/^gitlab:\/\/([^/]+)\/([^?]+)\?ref=([^&]+)&path=(.+)$/);
    if (match && match[1] && match[2] && match[3] && match[4]) {
      return {
        type: "gitlab",
        owner: match[1],
        repo: match[2],
        ref: match[3],
        filePath: match[4],
      };
    }
  }

  return null;
}

export async function extractArchiveToCacheDir(
  archiveBuffer: ArrayBuffer,
  cacheDir: string,
): Promise<void> {
  const files = await parseTarGzip(archiveBuffer);
  const rootPrefix = files[0]?.name.split("/")[0];

  if (!rootPrefix) {
    throw new Error("Invalid archive: no files found");
  }

  for (const file of files) {
    if (file.type === "directory" || !file.data) continue;

    const relativePath = file.name.slice(rootPrefix.length + 1);
    if (!relativePath) continue;

    let safeRelativePath = path.normalize(relativePath);
    safeRelativePath = safeRelativePath.replace(/^([/\\])+/, "");

    if (!safeRelativePath) {
      continue;
    }

    const upSegment = `..${path.sep}`;
    if (
      safeRelativePath === ".."
      || safeRelativePath.startsWith(upSegment)
      || safeRelativePath.includes(`${path.sep}..${path.sep}`)
      || safeRelativePath.endsWith(`${path.sep}..`)
    ) {
      throw new Error(`Invalid archive entry path (path traversal detected): ${file.name}`);
    }

    const outputPath = path.join(cacheDir, safeRelativePath);
    const resolvedCacheDir = path.resolve(cacheDir);
    const resolvedOutputPath = path.resolve(outputPath);
    if (
      resolvedOutputPath !== resolvedCacheDir
      && !resolvedOutputPath.startsWith(resolvedCacheDir + path.sep)
    ) {
      throw new Error(`Invalid archive entry path (outside cache dir): ${file.name}`);
    }

    await mkdir(path.dirname(resolvedOutputPath), { recursive: true });
    await writeFile(resolvedOutputPath, file.data);
  }
}

export async function resolveRemoteSourceRef(
  source: RemotePipelineSource["type"],
  ref: SourceRepositoryRef,
): Promise<string> {
  if (source === "github") {
    return resolveGitHubRef(ref);
  }

  if (source === "gitlab") {
    return resolveGitLabRef(ref);
  }

  throw new Error(`Unsupported remote source type: ${String(source)}`);
}

export async function downloadRemoteSourceArchive(
  source: RemotePipelineSource["type"],
  ref: SourceRepositoryRefWithCommitSha,
): Promise<ArrayBuffer> {
  if (source === "github") {
    return downloadGitHubArchive(ref);
  }

  if (source === "gitlab") {
    return downloadGitLabArchive(ref);
  }

  throw new Error(`Unsupported remote source type: ${String(source)}`);
}

export interface MaterializeArchiveToDirOptions {
  archiveBuffer: ArrayBuffer;
  targetDir: string;
}

export async function materializeArchiveToDir(
  options: MaterializeArchiveToDirOptions,
): Promise<void> {
  const { archiveBuffer, targetDir } = options;

  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });

  try {
    await extractArchiveToCacheDir(archiveBuffer, targetDir);
  } catch (err) {
    await rm(targetDir, { recursive: true, force: true });
    throw err;
  }
}
