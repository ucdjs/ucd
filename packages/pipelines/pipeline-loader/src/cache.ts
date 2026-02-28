import type { RemotePipelineSource, SourceRepositoryRefWithSourceType } from "./types";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { getBaseRepoCacheDir } from "@ucdjs-internal/shared/config";
import { resolveRemoteSourceRef } from "./utils";

interface CacheMarker {
  source: RemotePipelineSource["type"];
  owner: string;
  repo: string;
  commitSha: string;
  createdAt: string;
}

const CACHE_MARKER_FILE = ".ucd-cache.json";

async function readCacheMarker(markerPath: string): Promise<unknown | null> {
  try {
    const raw = await readFile(markerPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isValidMarker(
  marker: unknown,
  expected: {
    source: RemotePipelineSource["type"];
    owner: string;
    repo: string;
    commitSha: string;
  },
): marker is CacheMarker {
  if (!marker || typeof marker !== "object") return false;
  const value = marker as Partial<CacheMarker>;

  return value.source === expected.source
    && value.owner === expected.owner
    && value.repo === expected.repo
    && value.commitSha === expected.commitSha
    && typeof value.createdAt === "string";
}

export type RemoteCacheReason
  = | "cache-hit"
    | "cache-miss"
    | "marker-missing"
    | "marker-invalid";

export interface RemoteCacheStatus {
  source: "github" | "gitlab";
  owner: string;
  repo: string;
  ref: string;
  commitSha: string;
  cacheDir: string;
  markerPath: string;
  cached: boolean;
  markerValid: boolean;
  reason: RemoteCacheReason;
}

export async function getRemoteSourceCacheStatus(input: SourceRepositoryRefWithSourceType): Promise<RemoteCacheStatus> {
  const { source, owner, repo, ref = "HEAD" } = input;
  const commitSha = await resolveRemoteSourceRef(source, { owner, repo, ref });
  const cacheDir = path.join(getBaseRepoCacheDir(), source, owner, repo, commitSha);
  const markerPath = path.join(cacheDir, CACHE_MARKER_FILE);

  const marker = await readCacheMarker(markerPath);
  const markerValid = isValidMarker(marker, { source, owner, repo, commitSha });

  return {
    source,
    owner,
    repo,
    ref,
    commitSha,
    cacheDir,
    markerPath,
    cached: markerValid,
    markerValid,
    reason: markerValid
      ? "cache-hit"
      : (marker ? "marker-invalid" : "marker-missing"),
  };
}

export async function writeCacheMarker(status: RemoteCacheStatus): Promise<void> {
  await writeFile(status.markerPath, JSON.stringify({
    source: status.source,
    owner: status.owner,
    repo: status.repo,
    commitSha: status.commitSha,
    createdAt: new Date().toISOString(),
  }), "utf8");
}
