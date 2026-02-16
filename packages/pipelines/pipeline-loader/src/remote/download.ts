import type { GitHubSource, GitLabSource } from "../types";
import type { RemoteFileList } from "./providers/github";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { patheRelative, PathTraversalError, resolveSafePath } from "@ucdjs/path-utils";
import picomatch from "picomatch";
import { github, gitlab } from "./providers";

export interface FindRemotePipelineFilesOptions {
  pattern?: string;
  customFetch?: typeof fetch;
}

export interface DownloadPipelineProjectOptions {
  customFetch?: typeof fetch;
  workdir?: string;
  files?: string[];
}

export interface DownloadPipelineProjectResult {
  workdir: string;
  files: string[];
}

export async function findRemotePipelineFiles(
  source: GitHubSource | GitLabSource,
  options: FindRemotePipelineFilesOptions = {},
): Promise<RemoteFileList> {
  const { pattern = "**/*.ucd-pipeline.ts", customFetch = fetch } = options;
  const { owner, repo, ref, path: remotePath } = source;

  const repoRef = { owner, repo, ref, path: remotePath };

  const fileList = source.type === "github"
    ? await github.listFiles(repoRef, { customFetch })
    : await gitlab.listFiles(repoRef, { customFetch });

  const isMatch = picomatch(pattern, {
    dot: true,
  });

  return {
    files: fileList.files.filter((file) => isMatch(file)),
    truncated: fileList.truncated,
  };
}

async function listAllRemoteFiles(
  source: GitHubSource | GitLabSource,
  customFetch: typeof fetch,
): Promise<string[]> {
  const repoRef = {
    owner: source.owner,
    repo: source.repo,
    ref: source.ref,
    path: "",
  };

  const list = source.type === "github"
    ? await github.listFiles(repoRef, { customFetch })
    : await gitlab.listFiles(repoRef, { customFetch });

  return list.files;
}

function ensureNonEmptyPath(filePath: string): string {
  const trimmed = filePath.trim();
  if (trimmed === "" || trimmed === ".") {
    throw new Error(`Invalid remote file path: ${filePath}`);
  }
  return trimmed;
}

function providerRepoRef(source: GitHubSource | GitLabSource): { owner: string; repo: string; ref?: string } {
  return {
    owner: source.owner,
    repo: source.repo,
    ref: source.ref,
  };
}

async function fetchRemoteFileContent(
  source: GitHubSource | GitLabSource,
  filePath: string,
  customFetch: typeof fetch,
): Promise<string> {
  const repoRef = providerRepoRef(source);

  if (source.type === "github") {
    return github.fetchFile(repoRef, filePath, { customFetch });
  }

  return gitlab.fetchFile(repoRef, filePath, { customFetch });
}

export async function downloadPipelineProject(
  source: GitHubSource | GitLabSource,
  options: DownloadPipelineProjectOptions = {},
): Promise<DownloadPipelineProjectResult> {
  const { customFetch = fetch } = options;

  const allRemoteFiles = options.files
    ? options.files
    : await listAllRemoteFiles(source, customFetch);

  const workdir = options.workdir
    ? path.resolve(options.workdir)
    : await mkdtemp(path.join(os.tmpdir(), "ucd-pipelines-remote-"));

  const unique = new Set(allRemoteFiles);
  const downloadedFiles: string[] = [];

  for (const filePath of unique) {
    const trimmedPath = ensureNonEmptyPath(filePath);

    let content: string;
    try {
      content = await fetchRemoteFileContent(source, trimmedPath, customFetch);
    } catch {
      continue;
    }

    let destination: string;
    try {
      destination = resolveSafePath(workdir, trimmedPath);
    } catch (err) {
      if (err instanceof PathTraversalError) {
        throw new Error(`Refusing to materialize unsafe path: ${filePath}`);
      }
      throw err;
    }

    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content, "utf-8");
    const relativePath = patheRelative(workdir, destination);
    downloadedFiles.push(relativePath);
  }

  return {
    workdir,
    files: downloadedFiles,
  };
}

export async function downloadPipelineSource(
  source: GitHubSource | GitLabSource,
  options: DownloadPipelineProjectOptions = {},
): Promise<DownloadPipelineProjectResult> {
  return downloadPipelineProject(source, options);
}

export async function downloadPipelineFile(
  source: GitHubSource | GitLabSource,
  filePath: string,
  options: Omit<DownloadPipelineProjectOptions, "files"> = {},
): Promise<{ workdir: string; filePath: string }> {
  const result = await downloadPipelineProject(source, {
    ...options,
    files: [filePath],
  });

  const trimmedPath = ensureNonEmptyPath(filePath);
  let destination: string;
  try {
    destination = resolveSafePath(result.workdir, trimmedPath);
  } catch (err) {
    if (err instanceof PathTraversalError) {
      throw new Error(`Refusing to materialize unsafe path: ${filePath}`);
    }
    throw err;
  }

  return {
    workdir: result.workdir,
    filePath: patheRelative(result.workdir, destination),
  };
}
