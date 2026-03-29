import { HttpResponse, mockFetch } from "#test-utils/msw";
import { act, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  buildConfigResponse,
  buildOverviewResponse,
  buildPipelineResponse,
  buildSourceFile,
  buildSourceResponse,
  buildSourceSummary,
} from "../fixtures";
import { renderFileRoute } from "../route-test-utils";

vi.mock("#hooks/use-live-updates", () => ({
  useLiveUpdates() {},
}));

describe("live updates", () => {
  it("refreshes the source file list when a watched source changes", async () => {
    let currentSource = buildSourceResponse({
      files: [
        buildSourceFile({
          id: "alpha",
          path: "src/alpha.ucd-pipeline.ts",
          label: "Alpha file",
        }),
      ],
    });

    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary({
          fileCount: currentSource.files.length,
          pipelineCount: currentSource.files.reduce((count, file) => count + file.pipelines.length, 0),
        }),
      ])],
      ["GET", "/api/sources/local", () => HttpResponse.json(currentSource)],
      ["GET", "/api/sources/local/overview", () => HttpResponse.json(buildOverviewResponse())],
    ]);

    const { queryClient } = await renderFileRoute(<div />, { initialLocation: "/s/local" });

    expect(await screen.findByText("Alpha file")).toBeInTheDocument();
    expect(screen.queryByText("Beta file")).not.toBeInTheDocument();

    currentSource = buildSourceResponse({
      files: [
        buildSourceFile({
          id: "alpha",
          path: "src/alpha.ucd-pipeline.ts",
          label: "Alpha file",
        }),
        buildSourceFile({
          id: "beta",
          path: "src/beta.ucd-pipeline.ts",
          label: "Beta file",
          pipelines: [
            {
              id: "beta-pipeline",
              name: "Beta pipeline",
              description: "Beta pipeline",
              versions: ["16.0.0"],
              routeCount: 1,
              sourceCount: 1,
              sourceId: "local",
            },
          ],
        }),
      ],
    });

    await act(async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["sources"],
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: ["sources", "local"],
        }),
      ]);
    });

    expect(await screen.findByText("Beta file")).toBeInTheDocument();
  });

  it("redirects back to the source page when the active file disappears", async () => {
    let currentSource = buildSourceResponse({
      files: [
        buildSourceFile({
          id: "alpha",
          path: "src/alpha.ucd-pipeline.ts",
          label: "Alpha file",
        }),
      ],
    });

    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary({
          fileCount: currentSource.files.length,
          pipelineCount: currentSource.files.reduce((count, file) => count + file.pipelines.length, 0),
        }),
      ])],
      ["GET", "/api/sources/local", () => HttpResponse.json(currentSource)],
      ["GET", "/api/sources/local/overview", () => HttpResponse.json(buildOverviewResponse())],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline", () => HttpResponse.json(buildPipelineResponse({
        ...buildPipelineResponse(),
        routes: [],
      }))],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions?limit=1", () => HttpResponse.json({
        executions: [],
        pagination: {
          total: 0,
          limit: 1,
          offset: 0,
          hasMore: false,
        },
      })],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions?limit=6", () => HttpResponse.json({
        executions: [],
        pagination: {
          total: 0,
          limit: 6,
          offset: 0,
          hasMore: false,
        },
      })],
    ]);

    const { history, queryClient } = await renderFileRoute(<div />, {
      initialLocation: "/s/local/alpha/main-pipeline",
    });

    expect(await screen.findByRole("heading", { name: "Main pipeline", level: 1 })).toBeInTheDocument();

    currentSource = buildSourceResponse({
      files: [],
    });

    await act(async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["sources"],
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: ["sources", "local"],
        }),
      ]);
    });

    await waitFor(() => {
      expect(history.location.pathname).toBe("/s/local");
    });
  });
});
