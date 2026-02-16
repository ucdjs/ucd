import type { GitHubSource, GitLabSource } from "../types";
import type { RemoteFileList, RemoteRequestOptions } from "./providers/github";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
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

export function ensureSafeRelativePath(filePath: string): string {
  const normalized = path.posix.normalize(filePath).replace(/^\/+/, "");

  if (normalized === "" || normalized === ".") {
    throw new Error(`Invalid remote file path: ${filePath}`);
  }

  if (normalized.startsWith("../") || normalized.includes("/../") || normalized === "..") {
    throw new Error(`Refusing to materialize unsafe path: ${filePath}`);
  }

  return normalized;
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
    const safeRelativePath = ensureSafeRelativePath(filePath);

    let content: string;
    try {
      content = await fetchRemoteFileContent(source, safeRelativePath, customFetch);
    } catch {
      continue;
    }

    const destination = path.join(workdir, safeRelativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content, "utf-8");
    downloadedFiles.push(safeRelativePath);
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

  return {
    workdir: result.workdir,
    filePath: ensureSafeRelativePath(filePath),
  };
}
