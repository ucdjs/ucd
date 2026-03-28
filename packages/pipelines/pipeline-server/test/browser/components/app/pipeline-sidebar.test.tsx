import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderFileRoute } from "../../route-test-utils";

// eslint-disable-next-line test/prefer-lowercase-title
describe("PipelineSidebar", () => {
  beforeEach(() => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json({ workspaceId: "workspace-123", version: "16.0.0" })],
      ["GET", "/api/sources", () => HttpResponse.json([
        { id: "local", type: "local", label: "Local Source", fileCount: 1, pipelineCount: 1, errors: [] },
      ])],
      ["GET", "/api/sources/:sourceId", ({ params }) => HttpResponse.json({
        id: params.sourceId,
        type: "local",
        label: "Local Source",
        errors: [],
        files: [
          {
            id: "alpha",
            path: "src/alpha.ts",
            label: "Alpha file",
            pipelines: [
              { id: "main-pipeline", name: "Main pipeline", description: "Build and publish", versions: ["16.0.0"], routeCount: 2, sourceCount: 1, sourceId: "local" },
            ],
          },
        ],
      })],
      ["GET", "/api/sources/:sourceId/overview", () => HttpResponse.json({
        activity: [],
        summary: { total: 0, pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 },
        recentExecutions: [],
      })],
      ["GET", "/api/sources/:sourceId/files/:fileId/pipelines/:pipelineId", () => HttpResponse.json({
        pipeline: {
          id: "main-pipeline",
          name: "Main pipeline",
          description: "Build and publish",
          include: undefined,
          versions: ["16.0.0"],
          routeCount: 2,
          sourceCount: 1,
          routes: [],
          sources: [{ id: "local" }],
        },
      })],
      ["GET", "/api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/executions", () => HttpResponse.json({
        executions: [],
        pagination: { total: 0, limit: 12, offset: 0, hasMore: false },
      })],
    ]);
  });

  it("shows workspace metadata and the source switcher on source routes", async () => {
    await renderFileRoute(<div />, { initialLocation: "/s/local" });

    expect(await screen.findByTestId("pipeline-sidebar-workspace")).toHaveTextContent("workspace-123");
    expect(screen.getByTestId("pipeline-sidebar-version")).toHaveTextContent("16.0.0");
    expect(screen.getByTestId("pipeline-sidebar-source-switcher")).toBeInTheDocument();
    expect(screen.getByTestId("source-switcher-trigger")).toHaveTextContent("Local Source");
  });

  it("shows pipeline navigation and identity when on a pipeline route", async () => {
    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline" });

    expect(await screen.findByTestId("pipeline-sidebar-nav")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-sidebar-nav-overview")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-sidebar-nav-inspect")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-sidebar-nav-executions")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-sidebar-identity")).toHaveTextContent("Main pipeline");
    expect(screen.getByTestId("pipeline-sidebar-back-link")).toBeInTheDocument();
  });
});
