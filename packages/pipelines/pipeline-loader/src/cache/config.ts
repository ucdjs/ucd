import path from "node:path";
import { getUcdConfigPath } from "@ucdjs-internal/shared/config";

export function getBaseRepoCacheDir(): string {
  return getUcdConfigPath("cache", "repos");
}

export function getRepositoryCacheDir(
  source: string,
  owner: string,
  repo: string,
  commitSha: string,
): string {
  return path.join(getBaseRepoCacheDir(), source, owner, repo, commitSha);
}
