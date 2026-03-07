import type { PipelineLoaderIssue } from "@ucdjs/pipelines-loader";
import { resolveSourceFiles } from "#server/lib/resolve";
import { H3 } from "h3";

export const sourcesIndexRouter: H3 = new H3();

type SerializablePipelineLoaderIssue = Omit<PipelineLoaderIssue, "cause">;

sourcesIndexRouter.get("/", async (event) => {
  const { sources } = event.context;

  const results = await Promise.allSettled(
    sources.map((source) => resolveSourceFiles(source)),
  );

  return results.map((result, i) => {
    const source = sources[i]!;
    const base = { id: source.id, type: source.kind === "remote" ? source.provider : "local" };

    if (result.status === "rejected") {
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      return {
        ...base,
        fileCount: 0,
        pipelineCount: 0,
        errors: [{
          code: "IMPORT_FAILED",
          scope: "import",
          message,
        }],
      };
    }

    const { files, issues } = result.value;
    return {
      ...base,
      fileCount: files.length,
      pipelineCount: files.reduce((sum, f) => sum + f.pipelines.length, 0),
      errors: issues.map(({ cause: _cause, ...issue }) => issue),
    };
  }) satisfies {
    id: string;
    type: string;
    fileCount: number;
    pipelineCount: number;
    errors?: SerializablePipelineLoaderIssue[];
  }[];
});
