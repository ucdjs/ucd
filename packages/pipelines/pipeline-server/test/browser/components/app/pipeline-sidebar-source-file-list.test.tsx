import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderFileRoute } from "../../route-test-utils";

const sourceResponse = {
  id: "local",
  type: "local",
  label: "Local Source",
  errors: [],
  files: [
    {
      id: "alpha",
      path: "nested/alpha.ts",
      label: "Alpha file",
      pipelines: [
        {
          id: "alpha-pipeline",
          name: "Alpha pipeline",
          description: "Main alpha pipeline",
          versions: ["16.0.0"],
          routeCount: 3,
          sourceCount: 1,
          sourceId: "local",
        },
      ],
    },
    {
      id: "beta",
      path: "beta.ts",
      label: "Beta file",
      pipelines: [],
    },
  ],
};

// eslint-disable-next-line test/prefer-lowercase-title
describe("SourceFileList", () => {
  beforeEach(() => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json({ workspaceId: "workspace-123", version: "16.0.0" })],
      ["GET", "/api/sources", () => HttpResponse.json([{ id: "local", type: "local", label: "Local Source", fileCount: 2, pipelineCount: 4, errors: [] }])],
      ["GET", "/api/sources/:sourceId", ({ params }) => HttpResponse.json(params.sourceId === "local" ? sourceResponse : { id: params.sourceId, type: "local", label: params.sourceId, errors: [], files: [] })],
      ["GET", "/api/sources/:sourceId/overview", () => HttpResponse.json({ activity: [], summary: { total: 0, pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 }, recentExecutions: [] })],
    ]);
  });

  it("renders source files once data is loaded", async () => {
    await renderFileRoute(<div />, { initialLocation: "/s/local" });

    expect(await screen.findAllByText("alpha.ts")).not.toHaveLength(0);
    expect(screen.getAllByText("beta.ts")).not.toHaveLength(0);
  });

  it.todo("renders nested files and lets the user expand a file to reveal its pipelines");
});
