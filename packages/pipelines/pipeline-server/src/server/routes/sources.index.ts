import type { PipelineFileGroup, PipelineLoadErrorInfo } from "#server/lib/files";
import { loadPipelineFileGroups } from "#server/lib/files";
import { H3 } from "h3";

export const sourcesIndexRouter: H3 = new H3();

sourcesIndexRouter.get("/", async (event) => {
  const { sources } = event.context;

  return sources.map((s) => ({
    id: s.id,
    type: s.type,
  }));
});

sourcesIndexRouter.get("/:sourceId", async (event) => {
  const { sources } = event.context;
  const sourceId = event.context.params?.sourceId;

  const source = sources.find((s) => s.id === sourceId);
  if (!source) {
    throw new Error("Source not found");
  }

  const groups = await loadPipelineFileGroups([source]);
  const allFiles: PipelineFileGroup[] = [];
  const allErrors: PipelineLoadErrorInfo[] = [];

  for (const group of groups) {
    allFiles.push(...group.fileGroups);
    allErrors.push(...group.errors);
  }

  return {
    sourceId,
    files: allFiles.map((file) => ({
      fileId: file.fileId,
      filePath: file.filePath,
      sourceFilePath: file.sourceFilePath,
      fileLabel: file.fileLabel,
      sourceId: file.sourceId,
      pipelines: file.pipelines,
    })),
    errors: allErrors,
  };
});
