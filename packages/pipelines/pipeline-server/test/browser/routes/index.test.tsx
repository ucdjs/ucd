import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderFileRoute } from "./route-test-utils";

vi.mock("#components/app/pipeline-command-palette", () => {
  return {
    PipelineCommandPalette: () => null,
  };
});

vi.mock("@tanstack/react-devtools", () => {
  return {
    TanStackDevtools: () => null,
  };
});

vi.mock("@tanstack/react-query-devtools", () => {
  return {
    ReactQueryDevtoolsPanel: () => null,
  };
});

vi.mock("@tanstack/react-hotkeys-devtools", () => {
  return {
    HotkeysDevtoolsPanel: () => null,
  };
});

vi.mock("@tanstack/react-router-devtools", () => {
  return {
    TanStackRouterDevtoolsPanel: () => null,
  };
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("file-based route /", () => {
  it("renders the home route through the generated route tree", async () => {
    mockFetch([
      ["GET", "/api/config", () => {
        return HttpResponse.json({
          workspaceId: "workspace-123",
          version: "16.0.0",
        });
      }],
      ["GET", "/api/sources", () => {
        return HttpResponse.json([
          {
            id: "local",
            type: "local",
            label: "Local Source",
            fileCount: 1,
            pipelineCount: 2,
            errors: [],
          },
        ]);
      }],
      ["GET", "/api/overview", () => {
        return HttpResponse.json({
          activity: [
            {
              date: "2026-03-20",
              pending: 0,
              running: 1,
              completed: 2,
              failed: 0,
              cancelled: 0,
            },
          ],
          summary: {
            total: 3,
            pending: 0,
            running: 1,
            completed: 2,
            failed: 0,
            cancelled: 0,
          },
          recentExecutions: [
            {
              id: "exec-1",
              sourceId: "local",
              fileId: "alpha",
              pipelineId: "first-pipeline",
              status: "completed",
              startedAt: "2026-03-20T10:00:00.000Z",
              completedAt: "2026-03-20T10:01:00.000Z",
              versions: ["16.0.0"],
              summary: {
                versions: ["16.0.0"],
                totalRoutes: 5,
                cached: 1,
                totalFiles: 10,
                matchedFiles: 8,
                skippedFiles: 1,
                fallbackFiles: 1,
                totalOutputs: 4,
                durationMs: 60000,
              },
              hasGraph: true,
              error: null,
            },
          ],
        });
      }],
    ]);

    const { history } = await renderFileRoute("/");

    expect(await screen.findByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-sidebar-workspace")).toHaveTextContent("workspace-123");
    expect(screen.getByTestId("pipeline-sidebar-version")).toHaveTextContent("16.0.0");
    expect(screen.getByText("1 sources")).toBeInTheDocument();
    expect(history.location.pathname).toBe("/");
  });
});
