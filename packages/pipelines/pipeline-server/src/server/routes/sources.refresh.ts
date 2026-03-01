import { syncRemoteSource } from "@ucdjs/pipelines-loader";
import { H3 } from "h3";

export const sourcesRefreshRouter: H3 = new H3();

// POST /api/sources/:sourceId/refresh - Refresh a remote source cache
sourcesRefreshRouter.post("/:sourceId/refresh", async (event) => {
  const { sources } = event.context;
  const sourceId = event.context.params?.sourceId;

  if (!sourceId) {
    return { error: "Source ID is required" };
  }

  // Find the source configuration
  const source = sources.find((s: { id: string }) => s.id === sourceId);
  if (!source) {
    return { error: `Source "${sourceId}" not found` };
  }

  // Only remote sources can be refreshed
  if (source.type === "local") {
    return { error: "Cannot refresh local sources" };
  }

  const { type, owner, repo, ref = "HEAD" } = source;

  try {
    const result = await syncRemoteSource({
      source: type,
      owner,
      repo,
      ref,
      force: false,
    });

    if (!result.success) {
      return {
        error: "Failed to refresh source",
        message: result.error?.message ?? "Unknown error",
      };
    }

    return {
      sourceId,
      source: type,
      owner,
      repo,
      ref,
      updated: result.updated,
      previousSha: result.previousSha,
      newSha: result.newSha,
      syncedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      error: "Failed to refresh source",
      message: err instanceof Error ? err.message : String(err),
    };
  }
});
