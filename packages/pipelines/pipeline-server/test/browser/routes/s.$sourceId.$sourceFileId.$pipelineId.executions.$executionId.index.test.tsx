import { HttpResponse, mockFetch } from "#test-utils/msw";
import { QueryClient } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderFileRoute } from "../route-test-utils";

describe("file-based route /s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId", () => {
  it.todo("renders spans, filters logs, shows truncation, and opens the span drawer", async () => {
    mockFetch([
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
              emits: [],
              filter: undefined,
              outputs: [],
              transforms: [],
            },
          ],
          sources: [{ id: "local" }],
        },
      })],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions/exec-1/events", () => HttpResponse.json({
        executionId: "exec-1",
        pipelineId: "main-pipeline",
        status: "completed",
        events: [
          {
            id: "event-1",
            type: "version:start",
            timestamp: "2026-03-20T10:00:00.000Z",
            data: {
              id: "event-1",
              type: "version:start",
              version: "16.0.0",
              spanId: "span-version",
              timestamp: 1000,
            },
          },
          {
            id: "event-2",
            type: "version:end",
            timestamp: "2026-03-20T10:00:00.060Z",
            data: {
              id: "event-2",
              type: "version:end",
              version: "16.0.0",
              durationMs: 60,
              spanId: "span-version",
              timestamp: 1060,
            },
          },
          {
            id: "event-3",
            type: "pipeline:start",
            timestamp: "2026-03-20T10:00:00.070Z",
            data: {
              id: "event-3",
              type: "pipeline:start",
              versions: ["16.0.0"],
              spanId: "span-pipeline",
              timestamp: 1070,
            },
          },
          {
            id: "event-4",
            type: "pipeline:end",
            timestamp: "2026-03-20T10:00:00.130Z",
            data: {
              id: "event-4",
              type: "pipeline:end",
              durationMs: 60,
              spanId: "span-pipeline",
              timestamp: 1130,
            },
          },
        ],
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
            stream: "stdout",
            message: "version-log",
            timestamp: "2026-03-20T10:00:00.010Z",
            payload: {
              message: "version-log",
              stream: "stdout",
              level: "info",
              source: "logger",
            },
          },
          {
            id: "log-2",
            spanId: "span-pipeline",
            stream: "stdout",
            message: "pipeline-log",
            timestamp: "2026-03-20T10:00:00.080Z",
            payload: {
              message: "pipeline-log",
              stream: "stdout",
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

    const user = userEvent.setup();

    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/executions/exec-1" });

    expect(await screen.findByText("Logs truncated")).toBeInTheDocument();
    expect(screen.getByText("4 events · Pipeline: main-pipeline")).toBeInTheDocument();
    expect(screen.getByText("Showing all captured logs for this execution.")).toBeInTheDocument();
    expect(screen.getByText("version-log")).toBeInTheDocument();
    expect(screen.getByText("pipeline-log")).toBeInTheDocument();

    await user.click(screen.getByTitle("version:start v16.0.0 · 60.0ms"));

    expect(screen.getByText("Filtered by span")).toBeInTheDocument();
    expect(screen.getByText("Logs filtered to the selected span")).toBeInTheDocument();
    expect(screen.getByText("Showing logs for the selected span.")).toBeInTheDocument();
    expect(screen.getByText("Span Details")).toBeInTheDocument();
  });

  it.todo("renders the no-spans fallback and the logs error boundary", async () => {
    mockFetch([
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
                routeCount: 1,
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
          routeCount: 1,
          sourceCount: 1,
          routes: [],
          sources: [{ id: "local" }],
        },
      })],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions/exec-1/events", () => HttpResponse.json({
        executionId: "exec-1",
        pipelineId: "main-pipeline",
        status: "failed",
        events: [],
        pagination: {
          total: 0,
          limit: 500,
          offset: 0,
          hasMore: false,
        },
      })],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions/exec-1/logs", () => HttpResponse.json({
        message: "Logs exploded",
      }, { status: 500 })],
    ]);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/executions/exec-1", queryClient });

    expect(await screen.findByText("No spans recorded for this execution.")).toBeInTheDocument();
    expect(await screen.findByText((content) => content.includes("Failed to load logs:"))).toBeInTheDocument();
  });
});
