import type { LoadedPipelineFile, LoadPipelinesResult, PipelineLoadError } from "../types";
import path from "node:path";
import { loadPipelineFile } from "../loader";
import { ensureSafeRelativePath } from "./download";

export async function loadMaterializedPipelineFiles(options: {
  filePaths: string[];
  workdir: string;
  throwOnError: boolean;
}): Promise<LoadPipelinesResult> {
  const { filePaths, workdir, throwOnError } = options;

  const resolveLocalPath = (filePath: string): string => path.join(workdir, ensureSafeRelativePath(filePath));

  if (throwOnError) {
    const wrapped = filePaths.map((filePath) =>
      loadPipelineFile(resolveLocalPath(filePath))
        .then((loaded) => ({ ...loaded, filePath }))
        .catch((err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          throw new Error(`Failed to load pipeline file: ${filePath}`, { cause: error });
        }),
    );

    const files = await Promise.all(wrapped);
    return {
      files,
      pipelines: files.flatMap((f) => f.pipelines),
      errors: [],
    };
  }

  const settled = await Promise.allSettled(
    filePaths.map(async (filePath) => {
      const loaded = await loadPipelineFile(resolveLocalPath(filePath));
      return {
        ...loaded,
        filePath,
      };
    }),
  );

  const files: LoadedPipelineFile[] = [];
  const errors: PipelineLoadError[] = [];

  for (const [index, result] of settled.entries()) {
    if (result.status === "fulfilled") {
      files.push(result.value);
      continue;
    }

    const error = result.reason instanceof Error
      ? result.reason
      : new Error(String(result.reason));

    errors.push({
      filePath: filePaths[index]!,
      error,
    });
  }

  return {
    files,
    pipelines: files.flatMap((f) => f.pipelines),
    errors,
  };
}
