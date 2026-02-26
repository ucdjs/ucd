import type { LoadPipelinesResult, PipelineSource } from "@ucdjs/pipelines-loader";
import path from "node:path";
import {
  findPipelineFiles,
  loadPipelinesFromPaths,
} from "@ucdjs/pipelines-loader";

export async function getPipelines(source: PipelineSource): Promise<LoadPipelinesResult> {
  let files: string[];
  
  if (source.type === "local") {
    files = await findPipelineFiles({ 
      source: { type: "local", cwd: source.cwd } 
    });
    const result = await loadPipelinesFromPaths(files);
    const normalize = (filePath: string) =>
      path.relative(source.cwd, filePath).replace(/\\/g, "/");

    return {
      ...result,
      files: result.files.map((file) => ({
        ...file,
        filePath: normalize(file.filePath),
      })),
      errors: result.errors.map((error) => ({
        ...error,
        filePath: normalize(error.filePath),
      })),
    };
  }

  // For GitHub/GitLab sources
  const sourceType = source.type;
  const { owner, repo, ref = "HEAD" } = source;
  
  // Find files in the remote repo
  files = await findPipelineFiles({
    source: {
      type: sourceType,
      owner,
      repo,
      ref,
      path: (source as any).path,
    },
  });

  // Convert to github:// or gitlab:// URLs
  const urls = files.map((filePath) => {
    return `${sourceType}://${owner}/${repo}?ref=${ref}&path=${filePath}`;
  });

  return loadPipelinesFromPaths(urls);
}
