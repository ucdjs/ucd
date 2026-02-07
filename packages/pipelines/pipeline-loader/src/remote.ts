import type { GitHubSource, GitLabSource, RemoteFileList } from "./remote/types";
import type { LoadedPipelineFile, LoadPipelinesResult, PipelineLoadError } from "./types";
import { loadPipelineFromContent } from "./insecure";
import * as github from "./remote/github";
import * as gitlab from "./remote/gitlab";

export interface FindRemotePipelineFilesOptions {
  pattern?: string;
  customFetch?: typeof fetch;
}

export async function findRemotePipelineFiles(
  source: GitHubSource | GitLabSource,
  options: FindRemotePipelineFilesOptions = {},
): Promise<RemoteFileList> {
  const { pattern = "**/*.ucd-pipeline.ts", customFetch = fetch } = options;
  const { owner, repo, ref, path } = source;

  const repoRef = { owner, repo, ref, path };

  let fileList: RemoteFileList;
  if (source.type === "github") {
    fileList = await github.listFiles(repoRef, { customFetch });
  } else {
    fileList = await gitlab.listFiles(repoRef, { customFetch });
  }

  const matcher = new RegExp(
    pattern
      .replace(/\*\*/g, ".*")
      .replace(/\*/g, "[^/]*")
      .replace(/\?/g, "."),
  );

  const matchedFiles = fileList.files.filter((file) => matcher.test(file));

  return {
    files: matchedFiles,
    truncated: fileList.truncated,
  };
}

export interface LoadRemotePipelinesOptions {
  throwOnError?: boolean;
  customFetch?: typeof fetch;
}

function buildRemoteIdentifier(
  provider: "github" | "gitlab",
  owner: string,
  repo: string,
  ref: string | undefined,
  filePath: string,
): string {
  const url = new URL(`${provider}://${owner}/${repo}`);
  url.searchParams.set("ref", ref ?? "HEAD");
  url.searchParams.set("path", filePath);
  return url.toString();
}

export async function loadRemotePipelines(
  source: GitHubSource | GitLabSource,
  filePaths: string[],
  options: LoadRemotePipelinesOptions = {},
): Promise<LoadPipelinesResult> {
  const { throwOnError = false, customFetch = fetch } = options;
  const { owner, repo, ref, type } = source;

  const repoRef = { owner, repo, ref };

  if (throwOnError) {
    const wrapped = filePaths.map((filePath) =>
      (type === "github"
        ? github.fetchFile(repoRef, filePath, { customFetch })
        : gitlab.fetchFile(repoRef, filePath, { customFetch })
      ).then((content) => loadPipelineFromContent(content, filePath, {
        identifier: buildRemoteIdentifier(type, owner, repo, ref, filePath),
        fetchFn: customFetch,
      })).catch((err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        throw new Error(`Failed to load pipeline file: ${filePath}`, { cause: error });
      }),
    );

    const results = await Promise.all(wrapped);
    const pipelines = results.flatMap((r) => r.pipelines);

    return {
      pipelines,
      files: results,
      errors: [],
    };
  }

  const settled = await Promise.allSettled(
    filePaths.map(async (filePath) => {
      const content = type === "github"
        ? await github.fetchFile(repoRef, filePath, { customFetch })
        : await gitlab.fetchFile(repoRef, filePath, { customFetch });
      return loadPipelineFromContent(content, filePath, {
        identifier: buildRemoteIdentifier(type, owner, repo, ref, filePath),
        fetchFn: customFetch,
      });
    }),
  );

  const files: LoadedPipelineFile[] = [];
  const errors: PipelineLoadError[] = [];

  for (const [i, result] of settled.entries()) {
    if (result.status === "fulfilled") {
      files.push(result.value);
      continue;
    }

    const error = result.reason instanceof Error
      ? result.reason
      : new Error(String(result.reason));
    errors.push({ filePath: filePaths[i]!, error });
  }

  const pipelines = files.flatMap((f) => f.pipelines);

  return {
    pipelines,
    files,
    errors,
  };
}
