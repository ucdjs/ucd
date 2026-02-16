import type {
  GitHubSource,
  GitLabSource,
  LoadPipelinesResult,
  RemoteInstallOptions,
  RemoteMaterializeOptions,
} from "../types";
import type { FindRemotePipelineFilesOptions } from "./download";
import {
  downloadPipelineFile,
  downloadPipelineProject,
  downloadPipelineSource,
  findRemotePipelineFiles,
} from "./download";
import { installRemotePipelineDependencies } from "./install";
import { loadMaterializedPipelineFiles } from "./materialized";
import { github, gitlab } from "./providers";

export type {
  DownloadPipelineProjectOptions,
  DownloadPipelineProjectResult,
} from "./download";
export {
  downloadPipelineFile,
  downloadPipelineProject,
  downloadPipelineSource,
  findRemotePipelineFiles,
  github,
  gitlab,
};
export type { FindRemotePipelineFilesOptions };

export interface LoadRemotePipelinesOptions {
  throwOnError?: boolean;
  customFetch?: typeof fetch;
  materialize?: RemoteMaterializeOptions;
  install?: RemoteInstallOptions;
}

export async function loadRemotePipelines(
  source: GitHubSource | GitLabSource,
  filePaths: string[],
  options: LoadRemotePipelinesOptions = {},
): Promise<LoadPipelinesResult> {
  const {
    throwOnError = false,
    customFetch = fetch,
    install = {},
  } = options;

  const downloaded = await downloadPipelineProject(source, {
    customFetch,
    workdir: options.materialize?.workdir,
  });

  await installRemotePipelineDependencies(downloaded.workdir, install);

  return loadMaterializedPipelineFiles({
    filePaths,
    workdir: downloaded.workdir,
    throwOnError,
  });
}
