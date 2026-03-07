import { loadSourceFiles } from "#server/lib/lookup";
import { H3, HTTPError } from "h3";

export const sourcesSourceRouter: H3 = new H3();

sourcesSourceRouter.use("/:sourceId/**", async (event, next) => {
  const { sources } = event.context;
  const sourceId = event.context.params?.sourceId;
  if (!sourceId) {
    throw HTTPError.status(400, "Source ID is required");
  }

  const source = sources.find((s) => s.id === sourceId);
  if (source == null) {
    throw HTTPError.status(404, `Source "${sourceId}" not found`);
  }

  const { files, errors } = await loadSourceFiles(source);

  event.context.resolvedSource = {
    ...source,
    files,
    errors,
  };

  return next();
});

sourcesSourceRouter.get("/:sourceId", async (event) => {
  const { resolvedSource } = event.context;
  if (resolvedSource == null) {
    throw HTTPError.status(404, "Source not found");
  }

  return {
    id: resolvedSource.id,
    type: resolvedSource.type,
    files: resolvedSource.files.map((file) => ({
      id: file.id,
      path: file.relativePath,
      label: file.label,
    })),
    errors: resolvedSource.errors,
  };
});
