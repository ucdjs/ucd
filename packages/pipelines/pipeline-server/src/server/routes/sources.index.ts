import { loadSourceFiles } from "#server/lib/lookup";
import { H3 } from "h3";

export const sourcesIndexRouter: H3 = new H3();

sourcesIndexRouter.get("/", async (event) => {
  const { sources } = event.context;

  const results = await Promise.allSettled(
    sources.map((source) => loadSourceFiles(source)),
  );

  return results.map((result, i) => {
    const source = sources[i]!;
    const base = { id: source.id, type: source.type };

    if (result.status === "rejected") {
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      return { ...base, fileCount: 0, pipelineCount: 0, errors: [{ message }] };
    }

    const { files, errors } = result.value;
    return {
      ...base,
      fileCount: files.length,
      pipelineCount: files.reduce((sum, f) => sum + f.pipelines.length, 0),
      errors,
    };
  }) satisfies {
    id: string;
    type: string;
    fileCount: number;
    pipelineCount: number;
    errors?: { message: string; filePath?: string }[];
  }[];
});
