import { HttpResponse, mockFetch } from "#test-utils/msw";
import { act, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildConfigResponse,
  buildOverviewResponse,
  buildPipelineResponse,
  buildSourceFile,
  buildSourceResponse,
  buildSourceSummary,
} from "../fixtures";
import { renderFileRoute } from "../route-test-utils";
import { emitLiveUpdate } from "../websocket-test-utils";

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
    let overviewRequests = 0;

    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary({
          fileCount: currentSource.files.length,
          pipelineCount: currentSource.files.reduce((count, file) => count + file.pipelines.length, 0),
        }),
      ])],
      ["GET", "/api/sources/local", () => HttpResponse.json(currentSource)],
      ["GET", "/api/sources/local/overview", () => {
        overviewRequests += 1;
        return HttpResponse.json(buildOverviewResponse());
      }],
    ]);

    await renderFileRoute(<div />, { initialLocation: "/s/local" });

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
      emitLiveUpdate({
        type: "source.changed",
        sourceId: "local",
        changes: [{
          kind: "add",
          path: "src/beta.ucd-pipeline.ts",
        }],
        occurredAt: new Date().toISOString(),
      });
    });

    expect(await screen.findByText("Beta file")).toBeInTheDocument();
    await waitFor(() => {
      expect(overviewRequests).toBeGreaterThan(1);
    });
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

    const { history } = await renderFileRoute(<div />, {
      initialLocation: "/s/local/alpha/main-pipeline",
    });

    expect(await screen.findByRole("heading", { name: "Main pipeline", level: 1 })).toBeInTheDocument();

    currentSource = buildSourceResponse({
      files: [],
    });

    await act(async () => {
      emitLiveUpdate({
        type: "source.changed",
        sourceId: "local",
        changes: [{
          kind: "unlink",
          path: "src/alpha.ucd-pipeline.ts",
        }],
        occurredAt: new Date().toISOString(),
      });
    });

    await waitFor(() => {
      expect(history.location.pathname).toBe("/s/local");
    });
  });
});
