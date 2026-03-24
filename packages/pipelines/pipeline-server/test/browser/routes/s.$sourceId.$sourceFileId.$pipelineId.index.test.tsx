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
    expect(screen.getByText("Definition snapshot")).toBeInTheDocument();
    expect(screen.getByText("Recent health")).toBeInTheDocument();
    expect(screen.getByText("Recent executions")).toBeInTheDocument();
    expect(screen.getByText("Busiest routes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Versions/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Execute" })).toBeInTheDocument();
    expect(screen.getByText("View latest execution")).toHaveAttribute(
      "href",
      "/s/local/alpha/main-pipeline/executions/exec-1",
    );
    expect(screen.getByText(/View latest graph/i)).toHaveAttribute(
      "href",
      "/s/local/alpha/main-pipeline/executions/exec-1/graph",
    );
    expect(screen.getByRole("tab", { name: "Inspect" })).toHaveAttribute(
      "href",
      "/s/local/alpha/main-pipeline/inspect",
    );
    expect(screen.getByRole("tab", { name: "Executions" })).toHaveAttribute(
      "href",
      "/s/local/alpha/main-pipeline/executions",
    );
    expect(screen.queryByRole("tab", { name: "Graphs" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /compile/i })).toHaveAttribute(
      "href",
      "/s/local/alpha/main-pipeline/inspect?route=compile",
    );
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

    expect(await screen.findByText("No executions yet")).toBeInTheDocument();
    expect(screen.getByText("Run the pipeline to build up execution history.")).toBeInTheDocument();
    expect(screen.getByText("No routes defined.")).toBeInTheDocument();
  });
});
