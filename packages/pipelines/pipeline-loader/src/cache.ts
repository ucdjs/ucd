import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getUcdConfigPath } from "@ucdjs-internal/shared/config";

type RemoteProvider = "github" | "gitlab";

function getBaseRepoCacheDir(): string {
  return getUcdConfigPath("cache", "repos");
}

export interface PipelineCacheEntry {
  source: RemoteProvider;
  owner: string;
  repo: string;
  ref: string;
  commitSha: string;
  syncedAt: string;
}

const CACHE_FILE_NAME = ".ucd-cache.json";

async function readCache(markerPath: string): Promise<PipelineCacheEntry | null> {
  try {
    const raw = await readFile(markerPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    // Validate marker structure
    if (!parsed || typeof parsed !== "object") return null;
    const marker = parsed as Partial<PipelineCacheEntry>;

    if (
      typeof marker.source === "string"
      && typeof marker.owner === "string"
      && typeof marker.repo === "string"
      && typeof marker.ref === "string"
      && typeof marker.commitSha === "string"
      && typeof marker.syncedAt === "string"
    ) {
      return marker as PipelineCacheEntry;
    }

    return null;
  } catch {
    return null;
  }
}

export interface RemoteCacheStatus {
  provider: RemoteProvider;
  owner: string;
  repo: string;
  ref: string;
  commitSha: string;
  cacheDir: string;
  markerPath: string;
  cached: boolean;
  syncedAt: string | null;
}

export async function getRemoteSourceCacheStatus(input: {
  provider: RemoteProvider;
  owner: string;
  repo: string;
  ref?: string;
}): Promise<RemoteCacheStatus> {
  const { provider, owner, repo, ref = "HEAD" } = input;

  // Cache by ref, not by SHA
  const cacheDir = path.join(getBaseRepoCacheDir(), provider, owner, repo, ref);
  const markerPath = path.join(cacheDir, CACHE_FILE_NAME);

  const marker = await readCache(markerPath);

  return {
    provider,
    owner,
    repo,
    ref,
    commitSha: marker?.commitSha ?? "",
    cacheDir,
    markerPath,
    cached: marker !== null,
    syncedAt: marker?.syncedAt ?? null,
  };
}

/**
 * Write a cache marker for a remote source.
 * Call this after downloading and extracting the archive.
 */
export async function writeCacheMarker(input: {
  provider: RemoteProvider;
  owner: string;
  repo: string;
  ref: string;
  commitSha: string;
  cacheDir: string;
  markerPath: string;
}): Promise<void> {
  const marker: PipelineCacheEntry = {
    source: input.provider,
    owner: input.owner,
    repo: input.repo,
    ref: input.ref,
    commitSha: input.commitSha,
    syncedAt: new Date().toISOString(),
  };
  await writeFile(input.markerPath, JSON.stringify(marker, null, 2), "utf8");
}

export async function clearRemoteSourceCache(input: {
  provider: RemoteProvider;
  owner: string;
  repo: string;
  ref?: string;
}): Promise<boolean> {
  const { provider, owner, repo, ref } = input;
  const status = await getRemoteSourceCacheStatus({ provider, owner, repo, ref });

  if (!status.cached) {
    return false;
  }

  try {
    await rm(status.cacheDir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * List all cached remote sources.
 */
export async function listCachedSources(): Promise<Array<{
  source: string;
  owner: string;
  repo: string;
  ref: string;
  commitSha: string;
  syncedAt: string;
  cacheDir: string;
}>> {
  const baseDir = getBaseRepoCacheDir();
  const results: Array<{
    source: string;
    owner: string;
    repo: string;
    ref: string;
    commitSha: string;
    syncedAt: string;
    cacheDir: string;
  }> = [];

  try {
    const sources = await readdir(baseDir, { withFileTypes: true });

    for (const sourceEntry of sources) {
      if (!sourceEntry.isDirectory()) continue;
      const source = sourceEntry.name;

      const owners = await readdir(path.join(baseDir, source), { withFileTypes: true });
      for (const ownerEntry of owners) {
        if (!ownerEntry.isDirectory()) continue;
        const owner = ownerEntry.name;

        const repos = await readdir(path.join(baseDir, source, owner), { withFileTypes: true });
        for (const repoEntry of repos) {
          if (!repoEntry.isDirectory()) continue;
          const repo = repoEntry.name;

          const refs = await readdir(path.join(baseDir, source, owner, repo), { withFileTypes: true });
          for (const refEntry of refs) {
            if (!refEntry.isDirectory()) continue;
            const ref = refEntry.name;

            const cacheDir = path.join(baseDir, source, owner, repo, ref);
            const markerPath = path.join(cacheDir, CACHE_FILE_NAME);
            const marker = await readCache(markerPath);

            if (marker) {
              results.push({
                source,
                owner,
                repo,
                ref,
                commitSha: marker.commitSha,
                syncedAt: marker.syncedAt,
                cacheDir,
              });
            }
          }
        }
      }
    }
  } catch {
    // Return empty array if cache directory doesn't exist or is inaccessible
  }

  return results;
}
