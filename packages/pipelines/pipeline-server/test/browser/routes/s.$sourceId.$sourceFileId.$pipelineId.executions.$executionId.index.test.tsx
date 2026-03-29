import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildConfigResponse,
  buildExecutionsResponse,
  buildPipelineResponse,
  buildSourceResponse,
  buildSourceSummary,
} from "../fixtures";
import { renderFileRoute } from "../route-test-utils";

const BASE_MOCKS = [
  ["GET", "/api/config", () => HttpResponse.json({
    workspaceId: "workspace-123",
    version: "16.0.0",
  })],
  ["GET", "/api/sources", () => HttpResponse.json([
    {
      id: "local",
      type: "local",
      label: "Local Source",
      fileCount: 1,
      pipelineCount: 1,
      errors: [],
    },
  ])],
  ["GET", "/api/sources/local", () => HttpResponse.json({
    id: "local",
    type: "local",
    label: "Local Source",
    errors: [],
    files: [
      {
        id: "alpha",
        path: "src/alpha.ts",
        label: "Alpha file",
        pipelines: [
          {
            id: "main-pipeline",
            name: "Main pipeline",
            description: "Build and publish",
            versions: ["16.0.0"],
            routeCount: 2,
            sourceCount: 1,
            sourceId: "local",
          },
        ],
      },
    ],
  })],
  ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline", () => HttpResponse.json({
    pipeline: {
      id: "main-pipeline",
      name: "Main pipeline",
      description: "Build and publish",
      include: undefined,
      versions: ["16.0.0"],
      routeCount: 2,
      sourceCount: 1,
      routes: [
        {
          id: "compile",
          cache: true,
          depends: [],
          filter: undefined,
          outputs: [],
          transforms: [],
        },
      ],
      sources: [{ id: "local" }],
    },
  })],
  ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions", ({ request }: { request: Request }) => {
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? "1");
    return HttpResponse.json({
      executions: [],
      pagination: { total: 0, limit, offset: 0, hasMore: false },
    });
  }],
] as const;

describe("file-based route /s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId", () => {
  it("renders spans, filters logs, shows truncation, and opens the span drawer", async () => {
    mockFetch([
      ...BASE_MOCKS,
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions/exec-1/traces", () => HttpResponse.json({
        executionId: "exec-1",
        pipelineId: "main-pipeline",
        status: "completed",
        traces: [
          {
            id: "trace-1",
            kind: "version.start",
            traceId: "run-1",
            spanId: "span-version",
            parentSpanId: "span-pipeline",
            timestamp: "2026-03-20T10:00:00.000Z",
            data: {
              id: "trace-1",
              kind: "version.start",
              pipelineId: "main-pipeline",
              traceId: "run-1",
              spanId: "span-version",
              parentSpanId: "span-pipeline",
              timestamp: 1742464800000,
              version: "16.0.0",
            },
          },
          {
            id: "trace-2",
            kind: "version.end",
            traceId: "run-1",
            spanId: "span-version",
            parentSpanId: "span-pipeline",
            timestamp: "2026-03-20T10:00:00.060Z",
            data: {
              id: "trace-2",
              kind: "version.end",
              pipelineId: "main-pipeline",
              traceId: "run-1",
              spanId: "span-version",
              parentSpanId: "span-pipeline",
              timestamp: 1742464800060,
              version: "16.0.0",
              durationMs: 60,
            },
          },
          {
            id: "trace-3",
            kind: "pipeline.start",
            traceId: "run-1",
            spanId: "span-pipeline",
            parentSpanId: null,
            timestamp: "2026-03-20T10:00:00.070Z",
            data: {
              id: "trace-3",
              kind: "pipeline.start",
              pipelineId: "main-pipeline",
              traceId: "run-1",
              spanId: "span-pipeline",
              timestamp: 1742464800070,
              versions: ["16.0.0"],
            },
          },
          {
            id: "trace-4",
            kind: "pipeline.end",
            traceId: "run-1",
            spanId: "span-pipeline",
            parentSpanId: null,
            timestamp: "2026-03-20T10:00:00.130Z",
            data: {
              id: "trace-4",
              kind: "pipeline.end",
              pipelineId: "main-pipeline",
              traceId: "run-1",
              spanId: "span-pipeline",
              timestamp: 1742464800130,
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
      })],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions/exec-1/logs", () => HttpResponse.json({
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
      })],
    ]);

    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/executions/exec-1" });

    expect(await screen.findByText("Logs truncated")).toBeInTheDocument();
    expect(screen.getByText("version-log")).toBeInTheDocument();
    expect(screen.getByText("pipeline-log")).toBeInTheDocument();

    await user.click(screen.getByTitle("version.start v16.0.0 · 60.0ms"));

    expect(screen.getAllByText("Span filter")).toHaveLength(2);
    expect(screen.getByText("Span Details")).toBeInTheDocument();
    expect(screen.getByText("version-log")).toBeInTheDocument();
    expect(screen.queryByText("pipeline-log")).not.toBeInTheDocument();
  });

  it("renders the no-spans fallback and the logs error boundary", async () => {
    mockFetch([
      ...BASE_MOCKS,
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions/exec-1/traces", () => HttpResponse.json({
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
      })],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions/exec-1/logs", () => HttpResponse.json(
        { message: "Logs exploded" },
        { status: 500 },
      )],
    ]);

    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/executions/exec-1" });

    expect(await screen.findByText("No spans recorded for this execution.")).toBeInTheDocument();
    expect(await screen.findByText((content) => content.includes("Failed to load logs:"))).toBeInTheDocument();
  });

  it("renders the not-found path for an invalid execution", async () => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary(),
      ])],
      ["GET", "/api/sources/local", () => HttpResponse.json(buildSourceResponse())],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline", () => HttpResponse.json(buildPipelineResponse({
        ...buildPipelineResponse(),
        routeCount: 2,
      }))],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions", () => HttpResponse.json(
        buildExecutionsResponse([], {
          pagination: { total: 0, limit: 1, offset: 0, hasMore: false },
        }),
      )],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions/exec-1/traces", () => HttpResponse.json({
        message: "Missing execution",
      }, { status: 404 })],
    ]);

    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/executions/exec-1" });

    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });
});
