import type { SourceResponse } from "#shared/schemas/source";
import { resolveSourceFiles, sourceLabel } from "#server/lib/resolve";
import { H3, HTTPError } from "h3";

export const sourcesSourceRouter: H3 = new H3();

sourcesSourceRouter.get("/:sourceId", async (event) => {
  const { sources } = event.context;
  const sourceId = event.context.params?.sourceId;
  if (!sourceId) {
    throw HTTPError.status(400, "Source ID is required");
  }

  const source = sources.find((source) => source.id === sourceId) ?? null;
  if (source == null) {
    throw HTTPError.status(404, `Source "${sourceId}" not found`);
  }

  const { files, issues } = await resolveSourceFiles(source);

  return {
    id: source.id,
    type: source.kind === "remote" ? source.provider : "local",
    label: sourceLabel(source),
    files: files.map((file) => ({
      id: file.id,
      path: file.relativePath,
      label: file.label,
    })),
    errors: issues.map(({ cause: _cause, ...issue }) => issue),
  } satisfies SourceResponse;
});
