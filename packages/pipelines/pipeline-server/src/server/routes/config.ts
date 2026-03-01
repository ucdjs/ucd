import { resolveWorkspace } from "#server/workspace";
import { H3 } from "h3";

export const configRouter: H3 = new H3();

// GET /api/config - Static configuration
configRouter.get("/", async () => {
  const workspace = resolveWorkspace();

  return {
    workspaceId: workspace.workspaceId,
    version: "0.1.0", // TODO: Get from package.json
  };
});
