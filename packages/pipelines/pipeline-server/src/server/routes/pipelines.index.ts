import type { PipelineFileGroup, PipelineLoadErrorInfo } from "#server/lib/files";
import {
  applySearchFilter,
  loadPipelineFileGroups,
} from "#server/lib/files";
import { getValidatedQuery, H3 } from "h3";
import { z } from "zod";

export const pipelinesIndexRouter: H3 = new H3();

pipelinesIndexRouter.get("/", async (event) => {
  const { sources } = event.context;
  const query = await getValidatedQuery(event, z.object({
    search: z.string().optional().transform((s) => s?.trim().toLowerCase()).default(""),
  }));

  const allFiles: PipelineFileGroup[] = [];
  const allErrors: PipelineLoadErrorInfo[] = [];

  const groups = await loadPipelineFileGroups(sources);
  for (const group of groups) {
    const filteredGroups = applySearchFilter(group.fileGroups, query.search);
    allFiles.push(...filteredGroups);
    allErrors.push(...group.errors);
  }

  return {
    files: allFiles.map((file) => ({
      fileId: file.fileId,
      filePath: file.filePath,
      fileLabel: file.fileLabel,
      sourceId: file.sourceId,
      pipelines: file.pipelines,
    })),
    errors: allErrors,
  };
});
