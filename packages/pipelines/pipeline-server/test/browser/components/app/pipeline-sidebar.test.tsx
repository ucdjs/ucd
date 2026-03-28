import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  buildConfigResponse,
  buildExecutionsResponse,
  buildPipelineResponse,
  buildSourceResponse,
  buildSourceSummary,
} from "../../fixtures";
import {
  dispatchModHotkey,
  getTestHotkeyManager,
  renderFileRoute,
} from "../../route-test-utils";

const VERSION_STORAGE_KEY = "ucd-versions-local:alpha:main-pipeline";

// eslint-disable-next-line test/prefer-lowercase-title
describe("PipelineSidebar", () => {
  beforeEach(() => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary(),
      ])],
      ["GET", "/api/sources/:sourceId", ({ params }) => HttpResponse.json(buildSourceResponse({
        id: params.sourceId as string,
      }))],
      ["GET", "/api/sources/:sourceId/overview", () => HttpResponse.json({
        activity: [],
        summary: { total: 0, pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 },
        recentExecutions: [],
      })],
      ["GET", "/api/sources/:sourceId/files/:fileId/pipelines/:pipelineId", () => HttpResponse.json(buildPipelineResponse({
        pipeline: {
          ...buildPipelineResponse().pipeline,
          versions: ["16.0.0", "15.1.0"],
          routeCount: 2,
        },
      }))],
      ["GET", "/api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/executions", () => HttpResponse.json(
        buildExecutionsResponse([], {
          pagination: { total: 0, limit: 12, offset: 0, hasMore: false },
        }),
      )],
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

  it("registers Mod+E on pipeline routes and navigates to the created execution", async () => {
    let executeCalls = 0;
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary(),
      ])],
      ["GET", "/api/sources/:sourceId", ({ params }) => HttpResponse.json(buildSourceResponse({
        id: params.sourceId as string,
      }))],
      ["GET", "/api/sources/:sourceId/overview", () => HttpResponse.json({
        activity: [],
        summary: { total: 0, pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 },
        recentExecutions: [],
      })],
      ["GET", "/api/sources/:sourceId/files/:fileId/pipelines/:pipelineId", () => HttpResponse.json(buildPipelineResponse({
        pipeline: {
          ...buildPipelineResponse().pipeline,
          versions: ["16.0.0", "15.1.0"],
          routeCount: 2,
        },
      }))],
      ["GET", "/api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/executions", () => HttpResponse.json(
        buildExecutionsResponse([], {
          pagination: { total: 0, limit: 12, offset: 0, hasMore: false },
        }),
      )],
      ["POST", "/api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/execute", () => {
        executeCalls += 1;
        return HttpResponse.json({
          success: true,
          executionId: "exec-123",
        });
      }],
    ]);

    const { history } = await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline" });
    const manager = getTestHotkeyManager();

    await waitFor(() => {
      expect(manager.isRegistered("Mod+E")).toBe(true);
    });

    dispatchModHotkey("e");

    await waitFor(() => {
      expect(executeCalls).toBe(1);
      expect(history.location.pathname).toBe("/s/local/alpha/main-pipeline/executions/exec-123");
    });
  });

  it("suppresses Mod+E when no versions are selected", async () => {
    let executeCalls = 0;
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary(),
      ])],
      ["GET", "/api/sources/:sourceId", ({ params }) => HttpResponse.json(buildSourceResponse({
        id: params.sourceId as string,
      }))],
      ["GET", "/api/sources/:sourceId/overview", () => HttpResponse.json({
        activity: [],
        summary: { total: 0, pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 },
        recentExecutions: [],
      })],
      ["GET", "/api/sources/:sourceId/files/:fileId/pipelines/:pipelineId", () => HttpResponse.json(buildPipelineResponse({
        pipeline: {
          ...buildPipelineResponse().pipeline,
          versions: ["16.0.0", "15.1.0"],
          routeCount: 2,
        },
      }))],
      ["GET", "/api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/executions", () => HttpResponse.json(
        buildExecutionsResponse([], {
          pagination: { total: 0, limit: 12, offset: 0, hasMore: false },
        }),
      )],
      ["POST", "/api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/execute", () => {
        executeCalls += 1;
        return HttpResponse.json({
          success: true,
          executionId: "exec-123",
        });
      }],
    ]);

    const { history } = await renderFileRoute(<div />, {
      initialLocation: "/s/local/alpha/main-pipeline",
      localStorage: {
        [VERSION_STORAGE_KEY]: JSON.stringify([]),
      },
    });
    const manager = getTestHotkeyManager();

    expect(await screen.findByRole("button", { name: "Execute" })).toBeDisabled();

    await waitFor(() => {
      expect(manager.isRegistered("Mod+E")).toBe(true);
    });

    dispatchModHotkey("e");

    await waitFor(() => {
      expect(executeCalls).toBe(0);
      expect(history.location.pathname).toBe("/s/local/alpha/main-pipeline");
    });
  });
});
