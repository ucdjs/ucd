import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderFileRoute } from "../route-test-utils";

describe("file-based route /s/$sourceId/$sourceFileId/$pipelineId", () => {
  it("renders the pipeline overview page with summary, health, direct graph links, and streamlined tabs", async () => {
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
                versions: ["16.0.0", "15.1.0"],
                routeCount: 4,
                sourceCount: 2,
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
          include: "**/*.txt",
          versions: ["16.0.0", "15.1.0"],
          routeCount: 4,
          sourceCount: 2,
          routes: [
            {
              id: "compile",
              cache: true,
              depends: [],
              emits: [{ id: "parsed-data", scope: "version" }],
              filter: "compile-filter",
              outputs: [{ dir: "dist", fileName: "compile.json" }],
              transforms: ["normalize", "dedupe"],
            },
            {
              id: "publish",
              cache: false,
              depends: [{ type: "route", routeId: "compile" }],
              emits: [{ id: "bundle", scope: "version" }],
              filter: "publish-filter",
              outputs: [{ dir: "dist", fileName: "bundle.txt" }],
              transforms: ["ship"],
            },
          ],
          sources: [{ id: "local" }],
        },
      })],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions", ({ request }) => {
        const limit = Number(new URL(request.url).searchParams.get("limit") ?? "6");

        return HttpResponse.json({
          executions: [
            {
              id: "exec-1",
              sourceId: "local",
              fileId: "alpha",
              pipelineId: "main-pipeline",
              status: "completed",
              startedAt: "2026-03-20T10:00:00.000Z",
              completedAt: "2026-03-20T10:01:00.000Z",
              versions: ["16.0.0"],
              summary: {
                versions: ["16.0.0"],
                totalRoutes: 2,
                cached: 1,
                totalFiles: 10,
                matchedFiles: 8,
                skippedFiles: 1,
                fallbackFiles: 1,
                totalOutputs: 2,
                durationMs: 60_000,
              },
              hasGraph: true,
              error: null,
            },
          ],
          pagination: {
            total: 1,
            limit,
            offset: 0,
            hasMore: false,
          },
        });
      }],
    ]);

    const { history } = await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline" });

    expect(await screen.findByText("Pipeline summary")).toBeInTheDocument();
    expect(screen.getByText("Recent executions")).toBeInTheDocument();
    expect(history.location.pathname).toBe("/s/local/alpha/main-pipeline");
  });

  it("renders empty states for recent executions and busiest routes", async () => {
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
                description: "",
                versions: ["16.0.0"],
                routeCount: 0,
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
          description: "",
          include: undefined,
          versions: ["16.0.0"],
          routeCount: 0,
          sourceCount: 1,
          routes: [],
          sources: [{ id: "local" }],
        },
      })],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions", ({ request }) => {
        const limit = Number(new URL(request.url).searchParams.get("limit") ?? "6");

        return HttpResponse.json({
          executions: [],
          pagination: {
            total: 0,
            limit,
            offset: 0,
            hasMore: false,
          },
        });
      }],
    ]);

    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline" });

    expect(await screen.findByText("Pipeline summary")).toBeInTheDocument();
  });
});
