import type { PipelineLoaderIssue } from "./errors";
import { relative } from "node:path";
import { glob } from "tinyglobby";

const TRAILING_SLASH_RE = /\/$/;
const BACKSLASH_RE = /\\/g;

export interface RemoteOriginMeta {
  provider: "github" | "gitlab";
  owner: string;
  repo: string;
  ref: string;
  path?: string;
}

export interface DiscoverPipelineFilesOptions {
  repositoryPath: string;
  patterns?: string | string[];
  origin?: RemoteOriginMeta;
}

export interface DiscoverPipelineFilesResult {
  files: Array<{
    filePath: string;
    relativePath: string;
    origin?: RemoteOriginMeta;
  }>;
  issues: PipelineLoaderIssue[];
}

function joinOriginPath(origin: RemoteOriginMeta | undefined, relativePath: string): RemoteOriginMeta | undefined {
  if (!origin) return undefined;
  return {
    ...origin,
    path: origin.path
      ? `${origin.path.replace(TRAILING_SLASH_RE, "")}/${relativePath}`
      : relativePath,
  };
}

export async function discoverPipelineFiles(
  options: DiscoverPipelineFilesOptions,
): Promise<DiscoverPipelineFilesResult> {
  const patterns = options.patterns
    ? Array.isArray(options.patterns) ? options.patterns : [options.patterns]
    : ["**/*.ucd-pipeline.ts"];

  try {
    const files = await glob(patterns, {
      cwd: options.repositoryPath,
      ignore: ["node_modules/**", "**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**"],
      absolute: true,
      onlyFiles: true,
    });

    return {
      files: files.map((filePath) => {
        const relativePath = relative(options.repositoryPath, filePath).replace(BACKSLASH_RE, "/");
        return {
          filePath,
          relativePath,
          origin: joinOriginPath(options.origin, relativePath),
        };
      }),
      issues: [],
    };
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    return {
      files: [],
      issues: [{
        code: "DISCOVERY_FAILED",
        scope: "discovery",
        message: cause.message,
        repositoryPath: options.repositoryPath,
        cause,
      }],
    };
  }
}
