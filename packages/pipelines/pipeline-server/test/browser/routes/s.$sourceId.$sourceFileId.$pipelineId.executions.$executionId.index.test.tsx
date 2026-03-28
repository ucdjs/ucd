import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  buildConfigResponse,
  buildExecutionsResponse,
  buildPipelineResponse,
  buildSourceResponse,
  buildSourceSummary,
} from "../fixtures";
import { renderFileRoute } from "../route-test-utils";

function mockExecutionDetailApi({
  tracesHandler = () => HttpResponse.json({
    executionId: "exec-1",
    pipelineId: "main-pipeline",
    status: "completed",
    traces: [
      {
        id: "trace-1",
        kind: "version.start",
        traceId: null,
        spanId: "span-version",
        parentSpanId: null,
        timestamp: "2026-03-20T10:00:00.000Z",
        data: {
          version: "16.0.0",
        },
      },
      {
        id: "trace-2",
        kind: "version.end",
        traceId: null,
        spanId: "span-version",
        parentSpanId: null,
        timestamp: "2026-03-20T10:00:00.060Z",
        data: {
          version: "16.0.0",
          durationMs: 60,
        },
      },
      {
        id: "trace-3",
        kind: "pipeline.start",
        traceId: null,
        spanId: "span-pipeline",
        parentSpanId: null,
        timestamp: "2026-03-20T10:00:00.070Z",
        data: {
          versions: ["16.0.0"],
        },
      },
      {
        id: "trace-4",
        kind: "pipeline.end",
        traceId: null,
        spanId: "span-pipeline",
        parentSpanId: null,
        timestamp: "2026-03-20T10:00:00.130Z",
        data: {
          durationMs: 60,
        },
      },
    ],
    outputManifest: [],
    pagination: {
      total: 4,
      limit: 500,
      offset: 0,
      hasMore: false,
    },
  }),
  logsHandler = () => HttpResponse.json({
    executionId: "exec-1",
    pipelineId: "main-pipeline",
    status: "completed",
    logs: [
      {
        id: "log-1",
        spanId: "span-version",
        message: "version-log",
        timestamp: "2026-03-20T10:00:00.010Z",
        payload: {
          message: "version-log",
          level: "info",
          source: "logger",
        },
      },
      {
        id: "log-2",
        spanId: "span-pipeline",
        message: "pipeline-log",
        timestamp: "2026-03-20T10:00:00.080Z",
        payload: {
          message: "pipeline-log",
          level: "info",
          source: "logger",
        },
      },
    ],
    truncated: true,
    capturedSize: 1024,
    originalSize: 4096,
    pagination: {
      total: 2,
      limit: 500,
      offset: 0,
      hasMore: false,
    },
  }),
}: {
  tracesHandler?: () => Response;
  logsHandler?: () => Response;
} = {}) {
  mockFetch([
    ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
    ["GET", "/api/sources", () => HttpResponse.json([
      buildSourceSummary(),
    ])],
    ["GET", "/api/sources/local", () => HttpResponse.json(buildSourceResponse())],
    ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline", () => HttpResponse.json(buildPipelineResponse({
      pipeline: {
        ...buildPipelineResponse().pipeline,
        routeCount: 2,
      },
    }))],
    ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions", () => HttpResponse.json(
      buildExecutionsResponse([], {
        pagination: { total: 0, limit: 1, offset: 0, hasMore: false },
      }),
    )],
    ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions/exec-1/traces", () => tracesHandler()],
    ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions/exec-1/logs", () => logsHandler()],
  ]);
}

describe("file-based route /s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId", () => {
  it("renders spans, filters logs, shows truncation, and opens the span drawer", async () => {
    const user = userEvent.setup();
    mockExecutionDetailApi();

    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/executions/exec-1" });

    expect(await screen.findByText("Logs truncated")).toBeInTheDocument();
    expect(screen.getByText(/4 traces/)).toBeInTheDocument();
    expect(screen.getByText("version-log")).toBeInTheDocument();
    expect(screen.getByText("pipeline-log")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "version.start v16.0.0 60.0ms" }));

    expect(await screen.findByText("Span Details")).toBeInTheDocument();
    expect(screen.getByText("Clear log filter")).toBeInTheDocument();
    expect(screen.getAllByText("Span filter").length).toBeGreaterThan(0);
    expect(screen.getByText("version-log")).toBeInTheDocument();
    expect(screen.queryByText("pipeline-log")).not.toBeInTheDocument();
  });

  it("renders the no-spans fallback and the logs error boundary", async () => {
    mockExecutionDetailApi({
      tracesHandler: () => HttpResponse.json({
        executionId: "exec-1",
        pipelineId: "main-pipeline",
        status: "failed",
        traces: [],
        outputManifest: [],
        pagination: {
          total: 0,
          limit: 500,
          offset: 0,
          hasMore: false,
        },
      }),
      logsHandler: () => HttpResponse.json({
        message: "Logs exploded",
      }, { status: 500 }),
    });

    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/executions/exec-1" });

    expect(await screen.findByText("No spans recorded for this execution.")).toBeInTheDocument();
    expect(await screen.findByText((content) => content.includes("Failed to load logs:"))).toBeInTheDocument();
  });

  it("renders the not-found path for an invalid execution", async () => {
    mockExecutionDetailApi({
      tracesHandler: () => HttpResponse.json({
        message: "Missing execution",
      }, { status: 404 }),
    });

    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/executions/exec-1" });

    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });
});
