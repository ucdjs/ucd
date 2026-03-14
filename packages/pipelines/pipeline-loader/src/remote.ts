import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseTarGzip } from "nanotar";
import { downloadGitHubArchive, resolveGitHubRef } from "./adapters/github";
import { downloadGitLabArchive, resolveGitLabRef } from "./adapters/gitlab";
import { getRemoteSourceCacheStatus, writeCacheMarker } from "./cache";

const LEADING_PATH_SEPARATORS_RE = /^([/\\])+/;

async function extractArchiveToDirectory(
  archiveBuffer: ArrayBuffer,
  targetDir: string,
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
    safeRelativePath = safeRelativePath.replace(LEADING_PATH_SEPARATORS_RE, "");

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

    const outputPath = path.join(targetDir, safeRelativePath);
    const resolvedTargetDir = path.resolve(targetDir);
    const resolvedOutputPath = path.resolve(outputPath);
    if (
      resolvedOutputPath !== resolvedTargetDir
      && !resolvedOutputPath.startsWith(resolvedTargetDir + path.sep)
    ) {
      throw new Error(`Invalid archive entry path (outside target dir): ${file.name}`);
    }

    await mkdir(path.dirname(resolvedOutputPath), { recursive: true });
    await writeFile(resolvedOutputPath, file.data);
  }
}

async function resolveRemoteLocatorRef(
  provider: "github" | "gitlab",
  ref: { owner: string; repo: string; ref?: string },
): Promise<string> {
  if (provider === "github") {
    return resolveGitHubRef(ref);
  }

  return resolveGitLabRef(ref);
}

async function downloadRemoteLocatorArchive(
  provider: "github" | "gitlab",
  ref: { owner: string; repo: string; ref?: string; commitSha: string },
): Promise<ArrayBuffer> {
  if (provider === "github") {
    return downloadGitHubArchive(ref);
  }

  return downloadGitLabArchive(ref);
}

async function extractArchiveToCleanDirectory(
  archiveBuffer: ArrayBuffer,
  targetDir: string,
): Promise<void> {
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });

  try {
    await extractArchiveToDirectory(archiveBuffer, targetDir);
  } catch (err) {
    await rm(targetDir, { recursive: true, force: true });
    throw err;
  }
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentSha: string | null;
  remoteSha: string;
  error?: Error;
}

export async function checkRemoteLocatorUpdates(input: {
  provider: "github" | "gitlab";
  owner: string;
  repo: string;
  ref?: string;
}): Promise<UpdateCheckResult> {
  const { provider, owner, repo, ref = "HEAD" } = input;
  const status = await getRemoteSourceCacheStatus({ provider, owner, repo, ref });
  const currentSha = status.cached ? status.commitSha : null;

  try {
    const remoteSha = await resolveRemoteLocatorRef(provider, { owner, repo, ref });
    return {
      hasUpdate: currentSha !== remoteSha,
      currentSha,
      remoteSha,
    };
  } catch (err) {
    return {
      hasUpdate: false,
      currentSha,
      remoteSha: "",
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

export interface SyncResult {
  success: boolean;
  updated: boolean;
  previousSha: string | null;
  newSha: string;
  cacheDir: string;
  error?: Error;
}

export async function ensureRemoteLocator(input: {
  provider: "github" | "gitlab";
  owner: string;
  repo: string;
  ref?: string;
  force?: boolean;
}): Promise<SyncResult> {
  const { provider, owner, repo, ref = "HEAD", force = false } = input;
  const status = await getRemoteSourceCacheStatus({ provider, owner, repo, ref });
  const previousSha = status.cached ? status.commitSha : null;

  try {
    const commitSha = await resolveRemoteLocatorRef(provider, { owner, repo, ref });

    if (!force && status.cached && status.commitSha === commitSha) {
      return {
        success: true,
        updated: false,
        previousSha,
        newSha: commitSha,
        cacheDir: status.cacheDir,
      };
    }

    const archiveBuffer = await downloadRemoteLocatorArchive(provider, {
      owner,
      repo,
      ref,
      commitSha,
    });

    await rm(status.cacheDir, { recursive: true, force: true });
    await extractArchiveToCleanDirectory(archiveBuffer, status.cacheDir);

    await writeCacheMarker({
      provider,
      owner,
      repo,
      ref,
      commitSha,
      cacheDir: status.cacheDir,
      markerPath: status.markerPath,
    });

    return {
      success: true,
      updated: true,
      previousSha,
      newSha: commitSha,
      cacheDir: status.cacheDir,
    };
  } catch (err) {
    return {
      success: false,
      updated: false,
      previousSha,
      newSha: "",
      cacheDir: status.cacheDir,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}
