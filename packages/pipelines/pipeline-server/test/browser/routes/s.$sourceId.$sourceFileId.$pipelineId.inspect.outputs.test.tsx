import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { renderFileRoute } from "../route-test-utils";

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

function defaultRoutes() {
  return [
    {
      id: "compile",
      cache: true,
      depends: [],
      filter: "compile-filter",
      outputs: [
        { id: "compile-out-1", sink: "file", format: "json", dir: "dist", fileName: "compile.json" },
        { id: "compile-out-2", sink: "file", format: "text", dir: "reports", fileName: "compile.txt" },
      ],
      transforms: [],
    },
    {
      id: "publish",
      cache: false,
      depends: [{ type: "route", routeId: "compile" }],
      filter: "publish-filter",
      outputs: [{ id: "publish-out", sink: "file", format: "text", dir: "release", fileName: "bundle.txt" }],
      transforms: [],
    },
  ];
}

describe("file-based route /s/$sourceId/$sourceFileId/$pipelineId/inspect/outputs", () => {
  beforeEach(() => {
    const routes = defaultRoutes();

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
                routeCount: routes.length,
                sourceCount: 1,
                sourceId: "local",
              },
            ],
          },
        ],
      })],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions", () => HttpResponse.json({
        executions: [],
        pagination: { total: 0, limit: 1, offset: 0, hasMore: false },
      })],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline", () => HttpResponse.json({
        pipeline: {
          id: "main-pipeline",
          name: "Main pipeline",
          description: "Build and publish",
          include: undefined,
          versions: ["16.0.0"],
          routeCount: routes.length,
          sourceCount: 1,
          routes,
          sources: [{ id: "local" }],
        },
      })],
    ]);
  });

  it("auto-redirects from /inspect/outputs to the first output", async () => {
    const { history } = await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect/outputs" });

    await waitFor(() => {
      expect(history.location.pathname).toBe("/s/local/alpha/main-pipeline/inspect/outputs/compile%3A0");
    });
  });

  it("renders the output detail page with directory and file name", async () => {
    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect/outputs/compile%3A0" });

    await waitFor(() => {
      expect(screen.getAllByText("compile.json").length).toBeGreaterThan(0);
    });
  });

  it("shows the go-to-route link", async () => {
    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect/outputs/compile%3A0" });

    await waitFor(() => {
      expect(screen.getByText("Go to route")).toBeInTheDocument();
    });
  });

  it("shows other outputs section when the route has multiple outputs", async () => {
    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect/outputs/compile%3A0" });

    await waitFor(() => {
      expect(screen.getByText("Other outputs on this route")).toBeInTheDocument();
    });
  });

  it("hides other outputs section when the route has only one output", async () => {
    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect/outputs/publish%3A0" });

    await waitFor(() => {
      expect(screen.getAllByText("bundle.txt").length).toBeGreaterThan(0);
    });
    expect(screen.queryByText("Other outputs on this route")).not.toBeInTheDocument();
  });

  it("renders the empty outputs fallback when no outputs exist", async () => {
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
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions", () => HttpResponse.json({
        executions: [],
        pagination: { total: 0, limit: 1, offset: 0, hasMore: false },
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
          routes: [
            {
              id: "compile",
              cache: true,
              depends: [],
              filter: "compile-filter",
              outputs: [],
              transforms: [],
            },
          ],
          sources: [{ id: "local" }],
        },
      })],
    ]);

    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect/outputs" });

    expect(await screen.findByText("No outputs defined in this pipeline.")).toBeInTheDocument();
  });
});
