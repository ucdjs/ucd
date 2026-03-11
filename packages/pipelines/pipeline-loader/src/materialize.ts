import type { RemoteOriginMeta } from "./discover";
import type { PipelineLoaderIssue } from "./errors";
import { stat } from "node:fs/promises";
import path from "node:path";
import { getRemoteSourceCacheStatus } from "./cache";

export interface LocalPipelineLocator {
  kind: "local";
  path: string;
}

export interface RemotePipelineLocator {
  kind: "remote";
  provider: "github" | "gitlab";
  owner: string;
  repo: string;
  ref?: string;
  path?: string;
}

export type PipelineLocator = LocalPipelineLocator | RemotePipelineLocator;

export interface MaterializePipelineLocatorResult {
  repositoryPath?: string;
  filePath?: string;
  relativePath?: string;
  origin?: RemoteOriginMeta;
  issues: PipelineLoaderIssue[];
}

function createRemoteOrigin(locator: RemotePipelineLocator): RemoteOriginMeta {
  return {
    provider: locator.provider,
    owner: locator.owner,
    repo: locator.repo,
    ref: locator.ref ?? "HEAD",
    ...(locator.path ? { path: locator.path } : {}),
  };
}

async function detectPathKind(targetPath: string): Promise<"file" | "directory" | null> {
  return stat(targetPath)
    .then((value) => value.isFile() ? "file" : value.isDirectory() ? "directory" : null)
    .catch(() => null);
}

export async function materializePipelineLocator(
  locator: PipelineLocator,
): Promise<MaterializePipelineLocatorResult> {
  if (locator.kind === "local") {
    const absolutePath = path.resolve(locator.path);
    const pathKind = await detectPathKind(absolutePath);

    if (!pathKind) {
      return {
        issues: [{
          code: "MATERIALIZE_FAILED",
          scope: "file",
          message: `Path does not exist: ${absolutePath}`,
          locator,
          meta: { path: absolutePath },
        }],
      };
    }

    if (pathKind === "directory") {
      return {
        repositoryPath: absolutePath,
        issues: [],
      };
    }

    return {
      repositoryPath: path.dirname(absolutePath),
      filePath: absolutePath,
      relativePath: path.basename(absolutePath),
      issues: [],
    };
  }

  const ref = locator.ref ?? "HEAD";
  const status = await getRemoteSourceCacheStatus({
    provider: locator.provider,
    owner: locator.owner,
    repo: locator.repo,
    ref,
  });

  if (!status.cached) {
    return {
      issues: [{
        code: "CACHE_MISS",
        scope: "repository",
        message: `Remote repository ${locator.owner}/${locator.repo}@${ref} is not materialized in cache.`,
        locator,
        meta: {
          provider: locator.provider,
          owner: locator.owner,
          repo: locator.repo,
          ref,
        },
      }],
    };
  }

  const origin = createRemoteOrigin(locator);
  if (!locator.path) {
    return {
      repositoryPath: status.cacheDir,
      origin,
      issues: [],
    };
  }

  const targetPath = path.resolve(status.cacheDir, locator.path);
  if (targetPath !== status.cacheDir && !targetPath.startsWith(`${status.cacheDir}${path.sep}`)) {
    return {
      issues: [{
        code: "INVALID_LOCATOR",
        scope: "locator",
        message: `Remote path resolves outside materialized repository: ${locator.path}`,
        locator,
        repositoryPath: status.cacheDir,
      }],
    };
  }

  const pathKind = await detectPathKind(targetPath);
  if (!pathKind) {
    return {
      issues: [{
        code: "MATERIALIZE_FAILED",
        scope: "file",
        message: `Materialized path does not exist: ${locator.path}`,
        locator,
        repositoryPath: status.cacheDir,
        meta: { path: locator.path },
      }],
    };
  }

  if (pathKind === "directory") {
    return {
      repositoryPath: targetPath,
      relativePath: locator.path.replace(/\\/g, "/"),
      origin,
      issues: [],
    };
  }

  return {
    repositoryPath: path.dirname(targetPath),
    filePath: targetPath,
    relativePath: path.basename(targetPath),
    origin,
    issues: [],
  };
}
